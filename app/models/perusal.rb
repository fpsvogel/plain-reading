class Perusal < ApplicationRecord
  belongs_to :item
  belongs_to :format # TODO: ideally it'd be reversed: has_one :format (and in Format, belongs_to_many :perusals) but this association doesn't exist.
  has_many :chunks
end
