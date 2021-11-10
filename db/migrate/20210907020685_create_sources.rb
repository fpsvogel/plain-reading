class CreateSources < ActiveRecord::Migration
  def change
    create_table :sources do |t|
      t.string :name
      t.string :url

      t.timestamps
    end

    add_index :sources, :name
    add_index :sources, :url
    add_index :sources, [:name, :url], unique: true

    create_join_table :variants, :sources do |t|
      t.index :variant_id
      t.index :source_id
    end
  end
end
