class Series < ApplicationRecord
  belongs_to :item

  def to_s
    if volume
      "#{name}, ##{volume}"
    else
      "#{CsvConfig::SERIES_PREFIX} #{name}"
    end
  end
end
