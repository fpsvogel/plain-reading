class CreateItems < ActiveRecord::Migration[6.1]
  def change
    create_table :items do |t|
      t.float :rating
      t.string :author
      t.string :title
      t.integer :visibility
      t.text :public_notes
      t.text :blurb
      t.text :private_notes
      t.text :history
      t.string :view_url
      t.string :view_name
      t.string :view_date_finished
      t.references :list, null: false, foreign_key: true

      t.timestamps
    end
  end
end
