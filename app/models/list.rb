class List < ApplicationRecord
  belongs_to :user
  has_many :items

  serialize :load_errors, Array

  def path
    "/#{user.username}"
  end

  def visible_items
    current_visibility = user.visibility_configs.find_by(level: visibility_to_current_user)
    planned = []
    in_progress_and_done = items.reject do |item|
      show_by_visibility_genre_rating =
        item.visibility < current_visibility.level ||
          (item.genres.map(&:to_s) & current_visibility.hidden_genres).any? ||
          (item.rating || 0) < current_visibility.minimum_rating
      planned << item if item.planned? && show_by_visibility_genre_rating
      item.planned? || show_by_visibility_genre_rating
    end
    planned = nil unless current_visibility.planned_visible
    [in_progress_and_done, planned]
  end

  # TODO why is this approach to caching even slower than without it?
  # def visible_items
  #   visibility = visibility_to_current_user
  #   return items_for[visibility] unless items_for[visibility].nil?
  #   planned = []
  #   visibility_config = VisibilityConfig.find_by(level: visibility)
  #   in_progress_and_done = items.reject do |item|
  #     show_by_visibility_genre_rating =
  #       item.visibility < visibility_config.level ||
  #         (item.genres.map(&:to_s) & visibility_config.hidden_genres).any? ||
  #         (item.rating || 0) < visibility_config.minimum_rating
  #     planned << item if item.planned? && show_by_visibility_genre_rating
  #     item.planned? || show_by_visibility_genre_rating
  #   end
  #   planned = nil unless visibility_config.planned_visible
  #   items_for[visibility] = [in_progress_and_done,
  #                             planned]
  # end
  # def items_for
  #   @items_for ||= []
  # end

  def visible_genres
    uniq_of_attribute(:genres, sort_by: :frequency, convert: :to_s)
  end

  def visible_ratings
    uniq_of_attribute(:rating, sort_by: :value).map do |uniq_rating|
      if uniq_rating.to_i == uniq_rating
        uniq_rating.to_i
      else
        uniq_rating
      end
    end
  end

  def load_items(uploaded_file: nil, selective: true)
    clear_load_errors
    items.destroy_all
    file = uploaded_file || user.dropbox_account.reading_csv_file
    items_data = Reading::Csv::Parse.new(load_config)
                                    .call(file,
                                          selective: selective,
                                          skip_compact_planned: user.csv_config.skip_compact_planned)
    items_data.each do |data|
      item = items.build
      item.load_hash(data)
      item.save
    end
    # TODO why does load_errors become nil if it's a plain instance variable (instead of a db field)?
    load_errors.map!(&:to_s)
    save
  end

  def clear_load_errors
    self.load_errors = []
  end

  private

  def visibility_to_current_user
    # TODO assign different level based on whether the current user is myself, a
    # friend, starred friend, or a random visitor.
    VisibilityConfig::LEVELS[:public]
  end

  # returns the unique varieties of an attribute across all items.
  # sort_by: :frequency or :value
  # convert: type conversion, such as :to_s
  def uniq_of_attribute(attribute, sort_by:, convert: nil)
    all = items.flat_map do |item|
      item.send(attribute).presence
    end.compact.uniq
    if convert
      all.map do |value|
        value.send(convert)
      end
    end
    if sort_by == :frequency
      all.group_by(&:itself)
        .sort_by { |value, duplicates| duplicates.count }
        .reverse.to_h.keys
    elsif sort_by == :value
      all.sort
    end
  end

  def load_config
    Current.user.csv_config.to_h
           .deep_merge(errors: { handle_error: handle_error,
                                 style_mode: :html },
                       csv: { selective_continue: selective_continue })
  end

  def handle_error
    @handle_error ||= lambda do |error|
      load_errors << error
    end
  end

  # TODO countdown to stop (go 10 items further down from)
  def selective_continue
    @selective_continue ||= lambda do |last_parsed_data|
      last_title = last_parsed_data[:title]
      !items.find_by(title: last_title)
    end
  end
end
