class CreateVariants < ActiveRecord::Migration[6.1]
  def change
    create_table :variants do |t|
      t.string :isbn
      t.text :extra_info
      t.boolean :view
      t.references :length, polymorphic: true
      t.references :item, null: false, foreign_key: true
      t.references :format, foreign_key: true

      t.timestamps
    end

    add_index :variants, :isbn
    add_index :variants, :view
  end
end
