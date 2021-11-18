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

  DEFAULTS =
    {
      book:      ["📕", %i[print ebook audiobook pdf]],
      audio:     ["🔊", %i[audio]]
    }

  def format_names
    formats.map(&:name).join(", ")
  end

  def format_names=(new_value)
    names = new_value.split(/,\s*/)
    formats.delete_all
    names.each do |name|
      format = csv_config.formats.find_by(name: name)
      formats << format unless format.nil?
    end
  end

  def to_s
    emoji
  end
end
