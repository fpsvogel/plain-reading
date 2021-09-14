class Format < ApplicationRecord
  belongs_to :csv_config
  belongs_to :type,
              optional: "true"
  has_many :perusals

  DEFAULTS = {book:       ["📕", # print ... pdf each appear as book in My List.
                { print:      "📕",
                  ebook:      "⚡",
                  audiobook:  "🔊",
                  pdf:        "📄" }],
              audio:      ["🔊", # to show a different emoji in My List.
                { audio:      "🎤" }],
              video:      ["🎞️"],
              course:     ["🏫"],
              article:    ["📰"],
              website:    ["🌐"] }

  validates :name,
    # presence: true, # TODO re-enable this when the Settings page is reactive.
    uniqueness: true

  validates :emoji,
  # presence: true, # TODO re-enable this when the Settings page is reactive.
    uniqueness: true

  def type_by_name
    type&.name
  end

  def type_by_name=(new_value)
    t = Type.find_by(name)
    t.formats << self
    t.save
  end
end
