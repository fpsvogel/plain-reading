class Item < ApplicationRecord
  belongs_to :list
  has_and_belongs_to_many :series
  has_many :variants, dependent: :destroy
  has_many :experiences, dependent: :destroy
  has_and_belongs_to_many :genres
  has_one :view_variant, -> {where view: true}, class_name: "Variant"
  has_one :view_format, through: :view_variant, source: :format, dependent: :nullify, class_name: "Format"

  before_create :add_defaults

  attribute :visibility, default: VisibilityConfig::LEVELS[:public]
  serialize :group_experiences, Array
  serialize :public_notes, Array
  serialize :private_notes, Array
  serialize :history, Array

  validates :title,
    presence: true

  # TODO invalidate the cache, when Settings is changed
  def view_rating
    return read_attribute(:view_rating) unless read_attribute(:view_rating).nil?
    if list.user.csv_config.show_stars_as_rating?
      if rating >= list.user.csv_config.star_for_rating_minimum
        self.view_rating = "⭐"
      else
        self.view_rating = ""
      end
    else
      if rating.to_i == rating
        self.view_rating = rating.to_i
      else
        self.view_rating = rating
      end
    end
    save
    read_attribute(:view_rating)
  end

  # TODO invalidate the cache, when Settings is changed
  def view_type
    return read_attribute(:view_type) unless read_attribute(:view_type).nil?
    if list.user.visibility_configs.find_by(level: VisibilityConfig::LEVELS[:public]).formats_visible
      self.view_type = view_format || list.user.csv_config.default_emoji
    else
      self.view_type = view_format&.type || list.user.csv_config.default_emoji
    end
    save
    read_attribute(:view_type)
  end

  def view_date
    view_date_finished ||
      (CsvConfig::PLANNED_LABEL if planned?) ||
      CsvConfig::IN_PROGRESS_LABEL
  end

  # TODO invalidate the cache, when Settings is changed
  def group_experiences
    return read_attribute(:group_experiences) unless read_attribute(:group_experiences).nil?
    self.group_experiences = experiences.map { |experience| experience.group }.compact.presence
    save
    read_attribute(:group_experiences)
  end

  def load_hash(data)
    self.rating = data[:rating]
    self.title = data[:title]
    load_hash_series(data)
    load_hash_variants(data)
    load_hash_experiences(data)
    self.visibility = data[:visibility]
    load_hash_genres(data)
    self.public_notes = data[:public_notes]
    self.blurb = data[:blurb]
    self.private_notes = data[:private_notes]
    self.history = data[:history]
    set_view_attributes(data)
  end

  private

  def add_defaults
    unless genres.any?
      genres << Genre::DEFAULT
    end
    true
  end

  def load_hash_series(data)
    data[:series].each do |series_hash|
      series.build(name: series_hash[:name],
                  volume: series_hash[:volume])
    end
  end

  def load_hash_variants(data)
    data[:variants].each do |variants_hash|
      new_variant = variants.build(item_id: id)
      new_variant.format = Format.find_by(name: variants_hash[:format])
      variants_hash[:sources].each do |source_hash|
        existing_source = Source.find_by(name: source_hash[:name],
                                         url: source_hash[:url])
        if existing_source
          new_variant.sources << existing_source
        else
          new_variant.sources.build(name: source_hash[:name],
                                    url: source_hash[:url])
        end
      end
      new_variant.isbn = variants_hash[:isbn]
      case variants_hash[:length].class
      when Integer
        new_variant.length = PagesLength.new(variants_hash[:length])
        new_variant.length.build_variant
      when String
        new_variant.length = TimeLength.new(variants_hash[:length])
        new_variant.length.build_variant
      end
      new_variant.extra_info = variants_hash[:extra_info]
    end
  end

  def load_hash_experiences(data)
    data[:experiences].each do |experiences_hash|
      experiences.build(item_id: id,
                        date_added: experiences_hash[:date_added],
                        date_started: experiences_hash[:date_started],
                        date_finished: experiences_hash[:date_finished],
                        progress: experiences_hash[:progress],
                        group: experiences_hash[:group],
                        variant_id: variants.all[experiences_hash[:variant_index]])
    end
    self.planned = experiences.none? { |experience| experience.date_started || experience.date_finished }
  end

  def load_hash_genres(data)
    data[:genres].each do |genre_string|
      existing_genre = Genre.find_by(name: genre_string)
      if existing_genre
        self.genres << existing_genre
      else
        # self.genres.build(item_id: id, name: genre_string)
        self.genres.build(name: genre_string)
      end
    end
  end

  def set_view_attributes(data)
    first_isbn, format, extra_info =
      data[:variants].map do |variant|
        [variant[:isbn], variant[:format], variant[:extra_info]]
      end
      .reject { |isbn, format, extra_info| isbn.nil? }
      .first
    if first_isbn
      self.view_url = "https://www.goodreads.com/book/isbn?isbn=#{first_isbn}"
      variants.find { |variant| variant.isbn == first_isbn }.view = true
    else
      first_url, format, extra_info =
        data[:variants].map do |variant|
          url = variant[:sources].map { |source| source[:url] }.compact.first
          [url, variant[:format], variant[:extra_info]]
        end
        .reject { |url, format, extra_info| url.nil? }
        .first
      self.view_url = first_url
      unless first_url.nil?
        variants.find { |variant| variant.sources.map(&:url).include?(first_url) }.view = true
      end
    end
    series_and_extras = series.map(&:to_s) + (extra_info || [])
    self.view_name = "#{author + " – " if author}#{title}" +
                     "#{" 〜 " + (series_and_extras).join(" 〜 ") unless series_and_extras.empty?}"
    self.view_date_finished = data[:experiences].last&.dig(:date_finished)&.gsub("/", "-")
    self.view_format = Format.find_by(name: format)
  end
end
