class CsvConfig < ApplicationRecord
  belongs_to :user
  has_many :formats
  has_many :format_types
  has_many :columns
  has_many :custom_columns

  accepts_nested_attributes_for :formats
  accepts_nested_attributes_for :format_types
  accepts_nested_attributes_for :formats
  accepts_nested_attributes_for :columns
  accepts_nested_attributes_for :custom_columns

  before_create :build_default_formats
  before_create :build_default_format_types
  before_create :build_default_columns

  GROUP_EXPERIENCE_EMOJI = "🤝🏼"
  SERIES_PREFIX = "in"
  COMPACT_PLANNED_SOURCE_PREFIX = "@"
  IN_PROGRESS_LABEL = "in progress"
  PLANNED_LABEL = "planned"

  attribute :maximum_rating,
            default: 5
  attribute :star_for_rating_minimum,
            default: 0
  attribute :rating_key,
            default: "5: all-time favorite\n4: loved it\n3: pretty good\n2: meh\n1: why did I even"
  attribute :show_sort,
            default: true
  attribute :default_emoji,
            default: "📕"
  attribute :comment_character,
            default: "\\"
  attribute :dnf_string,
            default: "DNF"
  attribute :reverse_dates,
            default: false
  attribute :skip_compact_planned,
            default: true # TODO default to false (true is more convenient for my testing)

  def show_sort?
    show_sort
  end

  def show_stars_as_rating?
    star_for_rating_minimum > 0
  end

  def formats_or_types
    if user.visibility_configs.find_by(level: VisibilityConfig::LEVELS[:public]).formats_visible
      formats.to_a
    else
      formats.map(&:format_or_type).uniq
    end
  end

  # def all_possible_ratings
  #   (0..maximum_rating).map { |n| [n, n + 0.5] }.flatten[0..-2]
  # end

  # because IT'S OVER 9000!!!!!!!!!
  def maximum_rating_limit
    10_000
  end

  # TODO remove this after the Settings page is reactive.
  def destroy_blanks
    formats.where(name: nil).destroy_all
    formats.where(emoji: nil).destroy_all
    format_types.where(name: nil).destroy_all
    format_types.where(emoji: nil).destroy_all
    custom_columns.where(name: nil).destroy_all
  end

  def to_h
    # alternative:
    # current_user.csv_config.as_json(
    #                 include: { formats: { only: [:name, :emoji] },
    #                            columns: { only: [:name, :enabled] },
    #                            custom_columns: { only: [:name, :emoji] } })
    # but this would create a more verbose hash.
    # e.g. { …, formats: { { name: "print", emoji: "📕" },
    #                      { name: "audio", emoji: "🔊" },
    #                        … } }
    # the approach below makes a more compact hash.
    # e.g. { …, formats: { print: "📕",
    #                      audio: "🔊",
    #                      … } }
    columns_hash = columns.map { |c| [c.name, c.enabled] }.to_h
    custom_columns_hash = custom_columns.map { |cc| [cc.name, cc.format_type] }.to_h
    formats_hash = formats.map { |f| [f.name, f.emoji] }.to_h
    csv_config = %w[comment_character
                    dnf_string
                    reverse_dates]
    { csv:
        attributes
          .slice(*csv_config)
          .merge(columns: columns_hash)
          .merge(custom_columns: custom_columns_hash)
    }.merge(item: { formats: formats_hash })
  end

  private

  def build_default_formats
    Format::DEFAULTS.each do |name, emoji|
      # TODO why is it necessary to specify csv_config here?
      formats.build(name: name, emoji: emoji, csv_config: self)
    end
    true
  end

  def build_default_format_types
    FormatType::DEFAULTS.each do |type_name, (emoji, formats_of_type)|
      # TODO why is it necessary to specify csv_config here?
      new_format_type = format_types.build(name: type_name, emoji: emoji, csv_config: self)
      formats_of_type.each do |format_name|
        # .find because the formats have not yet been saved.
        format = formats.find { |format| format.name == format_name.to_s }
        if format.nil?
          raise "There is no Format called #{format_name}. Fix this in FormatType::DEFAULTS."
        end
        new_format_type.formats << format
      end
    end
    true
  end

  def build_default_columns
    Column::DEFAULTS.each do |name, info|
      if info[:enabled] == true
        columns.build(name: name, label: info[:label], enabled: true)
      elsif info[:enabled] == false
        columns.build(name: name, label: info[:label], enabled: false)
      end
    end
    true
  end
end
