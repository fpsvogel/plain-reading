class Genre < ApplicationRecord
  belongs_to :visibility_config, optional: true
  has_and_belongs_to_many :items

  DEFAULT = Genre.find_by(name: "uncategorized") || new(name: "uncategorized")

  validates :name,
    presence: true#,
    #uniqueness: true #TODO: uniqueness within one user.

  def to_s
    name
  end
end
