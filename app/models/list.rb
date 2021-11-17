class List < ApplicationRecord
  belongs_to :user
  has_many :items

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

  def reset_settings_related_view_attributes
    items.each(&:reset_settings_related_view_attributes)
  end

  def load_items(uploaded_file: nil, selective: true)
    clear_load_errors
    items.destroy_all
    destroy_orphaned_sources
    destroy_orphaned_genres
    file = uploaded_file || user.dropbox_account.reading_csv_file
    items_data = Reading::Csv::Parse.new(load_config)
                                    .call(file,
                                          selective: selective,
                                          skip_compact_planned: user.csv_config.skip_compact_planned)
    # these pre-queried objects avoid a per-new-item DB hit for Formats,
    # Sources, and Genres.
    user_formats = user.csv_config.formats.to_a
    user_sources = Source.includes(variants: { item: { list: :user } })
                         .where(variants: { items: { lists: { users: user } } })
                         .to_a
    user_genres = Genre.includes(items: { list: :user })
                       .where(items: { lists: { users: user } })
                       .to_a
    items_data.each do |data|
      item = items.new
      item.load_hash(data, user_formats: user_formats,
                           user_sources: user_sources,
                           user_genres: user_genres)
      item.save
    end
    # TODO why does load_errors become nil by this point if it's a plain
    # instance variable (instead of a db field)?
    load_errors.map!(&:to_s)
    save
  end

  def clear_load_errors
    self.load_errors = []
  end

  private

  def destroy_orphaned_sources
    Source.left_outer_joins(:variants)
          .where(variants: { id: nil })
          .destroy_all
  end

  def destroy_orphaned_genres
    Genre.left_outer_joins(:items)
          .where(items: { id: nil })
          .destroy_all
  end

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
