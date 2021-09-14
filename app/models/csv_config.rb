class CsvConfig < ApplicationRecord
  belongs_to :user
  has_many :formats
  has_many :types
  has_many :custom_columns

  accepts_nested_attributes_for :formats
  accepts_nested_attributes_for :types
  accepts_nested_attributes_for :custom_columns

  before_create :build_default_types
  before_create :build_default_formats

  attribute :rating_enabled       , default: true
  attribute :sources_isbn_enabled , default: true
  attribute :dates_started_enabled, default: true
  attribute :genres_enabled       , default: true
  attribute :length_enabled       , default: true
  attribute :public_notes_enabled , default: true
  attribute :blurb_enabled        , default: true
  attribute :private_notes_enabled, default: true
  attribute :history_enabled      , default: true
  attribute :maximum_rating       , default: 5
  attribute :rating_key           ,
    default: "5: all-time favorite\n4: loved it\n3: pretty good\n2: meh\n1: why did I even"
  attribute :group_read_emoji     , default: "🤝🏼"
  attribute :date_separator       , default: "/"
  attribute :notes_newline        , default: "--"
  attribute :extra_info_prefixes  ,
    default: ["trans.", "ed.", "a.k.a."]
  attribute :extra_info_postfixes  ,
    default: ["edition", "ed.", "(translator)", "(editor)"]

  serialize :extra_info_prefixes, Array
  serialize :extra_info_postfixes, Array

  def build_default_types
    Format::DEFAULTS.each do |name, (emoji, formats_in_type)|
      if formats_in_type
        types.build(name: name, emoji: emoji)
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

  # TODO remove this when the Settings page is reactive.
  def destroy_blanks
    formats.where(name: nil).destroy_all
    formats.where(emoji: nil).destroy_all
    types.where(name: nil).destroy_all
    types.where(emoji: nil).destroy_all
    custom_columns.where(name: nil).destroy_all
  end

  # def all_possible_ratings
  #   (0..maximum_rating).map { |n| [n, n + 0.5] }.flatten[0..-2]
  # end

  def maximum_rating_limit
    10_000
  end

  def extra_info_prefixes_string
    extra_info_prefixes.join(", ")
  end

  def extra_info_prefixes_string=(new_value)
    self.extra_info_prefixes = new_value.split(/,\s+/)
  end

  def extra_info_postfixes_string
    extra_info_postfixes.join(", ")
  end

  def extra_info_postfixes_string=(new_value)
    self.extra_info_postfixes = new_value.split(/,\s+/)
  end

  # def custom_column_1_name
  #   custom_columns.first&.name
  # end

  # def custom_column_1_type
  #   custom_columns.first&.type
  # end

  # def custom_column_2_name
  #   custom_columns.second&.name
  # end

  # def custom_column_2_type
  #   custom_columns.second&.type
  # end

  # def custom_column_3_name
  #   custom_columns.third&.name
  # end

  # def custom_column_3_type
  #   custom_columns.third&.type
  # end
end
