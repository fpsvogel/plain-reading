class Experience < ApplicationRecord
  belongs_to :item
  belongs_to :variant, optional: true
  has_many :chunks
end
