class List < ApplicationRecord
  belongs_to :user
  has_many :items

  serialize :load_errors, Array

  def path
    "/#{user.username}"
  end

  def visible_items
    current_visibility = user.visibility_configs.find_by(level: visibility_to_current_user)
    visible_items = items
      .where("visibility >= ?", current_visibility.level)
      .where("rating IS NOT NULL AND rating >= ?", current_visibility.minimum_rating)
      .includes(:genres)
      .where.not(genres: { name: current_visibility.hidden_genres.presence || [""] })
      .includes(:view_format)
      .order("view_date_finished DESC, title ASC")
    [visible_items, current_visibility.planned_visible]
  end

  def visible_genres(visible_items)
    uniq_of_attribute(visible_items, :genres, sort_by: :frequency, convert: :to_s)
  end

  def visible_ratings(visible_items)
    uniq_of_attribute(visible_items, :rating, sort_by: :value).map do |uniq_rating|
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
    user_formats = user.csv_config.formats.to_a # TODO move formats to list
    # user_sources = Source.includes(variants: { item: :list })
    #                      .where('variants.item.list.user = ?', user)
    #                      .to_a
    # user_genres = Genre.includes(items: :list)
    #                    .where(items: { list: { user_id: user.id } }) # or: .where('items.list.user_id = ?', user.id)
    #                    .to_a
    items_data.each do |data|
      item = items.new
      item.load_hash(data, user_formats: user_formats, user_sources: nil, user_genres: nil)
      item.save
    end
    # TODO why does load_errors become nil by this point if it's a plain instance variable (instead of a db field)?
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
  def uniq_of_attribute(visible_items, attribute, sort_by:, convert: nil)
    all = visible_items.flat_map do |item|
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
    user.csv_config.to_h
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
  # this is already done in my blog, so look there for inspiration.
  def selective_continue
    @selective_continue ||= lambda do |last_parsed_data|
      last_title = last_parsed_data[:title]
      !items.find_by(title: last_title)
    end
  end
end
