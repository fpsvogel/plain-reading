class Format < ApplicationRecord
  belongs_to :visibility_config, optional: true
  belongs_to :csv_config
  belongs_to :format_type, optional: true
  has_many :variants

  DEFAULTS =
    {
      print:      "📕",
      ebook:      "⚡",
      audiobook:  "🔊",
      pdf:        "📄",
      course:     "🏫",
      piece:      "✏️",
      audio:      "🎤",
      video:      "🎞️",
      website:    "🌐"
    }

  validates :name,
    # presence: true, # TODO re-enable this and delete allow_blank when the Settings page is reactive.
    allow_blank: true,
    uniqueness: true

  validates :emoji,
    # presence: true, # TODO re-enable this and delete allow_blank when the Settings page is reactive.
    allow_blank: true,
    uniqueness: true

  def to_s
    emoji
  end

  def format_or_type
    if format_type.nil?
      self
    else
      format_type
    end
  end
end
