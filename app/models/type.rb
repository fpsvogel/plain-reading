class Type < ApplicationRecord
  belongs_to :csv_config
  has_many :formats

  validates :name,
    uniqueness: true

  validates :emoji,
    uniqueness: true
end
