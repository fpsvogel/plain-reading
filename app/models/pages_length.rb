class PagesLength < ApplicationRecord
  has_one :variant, as: :length
end
