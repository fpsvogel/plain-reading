class TimeLength < ApplicationRecord
  has_one :variant, as: :length
end
