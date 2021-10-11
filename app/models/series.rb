class Series < ApplicationRecord
  has_and_belongs_to_many :items

  def to_s
    if volume
      "#{name}, ##{volume}"
    else
      "#{CsvConfig::SERIES_PREFIX} #{name}"
    end
  end
end
