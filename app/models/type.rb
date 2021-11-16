class FormatType < ApplicationRecord
  belongs_to :csv_config
  has_many :formats

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
end
