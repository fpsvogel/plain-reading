class Source < ApplicationRecord
  has_and_belongs_to_many :variants

  DEFAULT = Source.find_by(name: "unspecified") || new(name: "unspecified")

  validates :name,
    presence: true,
    uniqueness: { scope: :url } # the combination of name and url must be unique.

  validates :url,
    uniqueness: true,
    allow_nil: true
end
