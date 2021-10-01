class CsvConfig < ApplicationRecord
  belongs_to :user
  has_many :formats
  has_many :types
  has_many :columns
  has_many :custom_columns

  accepts_nested_attributes_for :formats
  accepts_nested_attributes_for :types
  accepts_nested_attributes_for :formats
  accepts_nested_attributes_for :columns
  accepts_nested_attributes_for :custom_columns

  before_create :build_default_types
  before_create :build_default_formats
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
            default: false

  def show_sort?
    show_sort
  end

  def show_stars_as_rating?
    star_for_rating_minimum > 0
  end

  def view_types
    if user.visibility_configs.find_by(level: VisibilityConfig::LEVELS[:public]).formats_visible
      formats
    else
      types
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
    types.where(name: nil).destroy_all
    types.where(emoji: nil).destroy_all
    custom_columns.where(name: nil).destroy_all
  end

  def to_h
    # alternative:
    # Current.user.csv_config.as_json(
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
    custom_columns_hash = custom_columns.map { |cc| [cc.name, cc.type] }.to_h
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

  def build_default_types
    Format::DEFAULTS.each do |name, (emoji, formats_in_type)|
      if formats_in_type
        # TODO why is it necessary to specify csv_config here?
        types.build(name: name, emoji: emoji, csv_config: self)
      end
    end
    true
  end

  def build_default_formats
    Format::DEFAULTS.each do |name, (emoji, formats_in_type)|
      if !formats_in_type
        formats.build(name: name, emoji: emoji)
      else
        type = types.select { |type| type.name == name.to_s &&
                                        type.emoji == emoji }
                    .first
        formats_in_type.each do |inner_name, inner_emoji|
          formats.build(name: inner_name,
                        emoji: inner_emoji,
                        type: type)
        end
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
