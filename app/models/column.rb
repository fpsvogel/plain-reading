class Column < ApplicationRecord
  belongs_to :csv_config

  DEFAULTS =  { rating:         { label: "Rating"                   , enabled: true },
                name:           { label: "Format, Author, Title"    , enabled: true },
                sources:        { label: "Sources, ISBN"            , enabled: true },
                dates_started:  { label: "Date added, Dates started", enabled: true },
                dates_finished: { label: "Dates finished"           , enabled: true },
                genres:         { label: "Genres"                   , enabled: true },
                length:         { label: "Length"                   , enabled: true },
                public_notes:   { label: "Public notes"             , enabled: true },
                blurb:          { label: "Blurb"                    , enabled: true },
                private_notes:  { label: "Private notes"            , enabled: true },
                history:        { label: "History"                  , enabled: true } }
end
