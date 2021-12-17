<h1 align="center">📘 Plain Reading 📘</h1>

Welcome to the [Plain Reading](https://plainreading.herokuapp.com) codebase. If you've ever wanted to keep track of your reading in a plain text file, and yet you still wanted a way to share it with friends, then Plain Reading is for you!

### Table of Contents

- [Why this is on my GitHub profile](#why-this-is-on-my-github-profile)
- [Rationale: Why am I building this?](#rationale-why-am-i-building-this)
- [Contributing](#contributing)
- [Requirements](#requirements)
- [Initial setup](#initial-setup)
- [License](#license)

## Why this is on my GitHub profile

This app is my labor of love. It's an evolution of [the Reading page on my personal site](https://fpsvogel.com/reading/): I wanted to give other people the tools to set up their own page built from on a plain-text reading list.

Plain Reading is also the most ambitious of my projects. Its CSV parser, which is [in my reading-csv gem](https://github.com/fpsvogel/reading-csv), flexibly accomodates a wide range of reading-tracking habits, from the minimal (writing down only titles and dates finished) to the meticulous (tracking everything up to amounts read per day).

The app itself deals with a lot of data: an avid reader's list could easily contain thousands of items. So I had to [carefully construct Active Record queries](https://github.com/fpsvogel/plainreading/blob/main/app/models/list.rb#L9) and [use a form of caching](https://github.com/fpsvogel/plainreading/blob/main/app/models/item.rb#L31) for some of the data shown on a user's reading list page.

You can read more about how I built the app in [my post after my first month's work on it](https://fpsvogel.com/posts/2021/first-rails-app-plain-reading).

As of December 2021, I'm taking a short break from working on Plain Reading. I'm improving my testing skills with Jason Swett's [Complete Guide to Rails Testing](https://www.codewithjason.com/complete-guide-to-rails-testing/), and I'm following his advice to train myself using fresh apps rather than trying to add tests into an existing app. (I'm normally careful about testing in my Ruby projects, but when I was learning Rails as I built this app, I found it more manageable not to worry about tests right away, and in any case the major backend component of the CSV parser was thoroughly covered by tests in the gem. This means I'll have to circle back in early 2022 to finish Plain Reading's test suite and build the rest of the planned features.)

## Rationale: Why am I building this?

Because I love reading and keeping track of my reading, but I don't love the limitations of Goodreads and other social reading sites. In particular:

- I don't like going into a site or app every time I want to make a small change such as adding a reading note. I find it much faster to edit a plain text file which I always have open on my computer.
- I don't like being limited to a library of existing book metadata. In Goodreads I could add new titles to their library, but that is cumbersome. Plus, it's nice to be able to track items other than books.
- On Goodreads and similar sites, my reading data is theirs, not mine. I could get my data by exporting it as a CSV file, but then the formatting of the file is terrible because it's full of junk columns that I don't want.

These considerations led me to start tracking my reading and notes directly in a CSV file. Then a problem arose: how to share my reading list with friends? I'm sure they wouldn't want to wade through my massive CSV file, and anyway I have some items and notes in there that I don't want everyone to see.

That's where Plain Reading helps: it transforms your `reading.csv` into a page that you can share with friends or the world.

Plain Reading is customizable in what data you want to include in your `reading.csv`. For more on the reading list format, see [the guide at Plain Reading](https://plainreading.herokuapp.com/guide).

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/fpsvogel/plainreading.

## Requirements

- Ruby 3+
- Node.js 14+
- PostgreSQL 9.3+

## Initial setup

- Checkout the plainreading git tree from Github:
    ```sh
    $ git clone git://github.com/fpsvogel/plainreading.git
    $ cd plainreading
    plainreading$
    ```
- Run Bundler to install gems needed by the project:
    ```sh
    plainreading$ bundle
    ```
- Log in to PostgreSQL and create a user:
    ```
    $ psql -U postgres
    postgres=# create role "your_username" login createdb
    postgres=# exit
    ```
- Create the development and test databases:
    ```sh
    plainreading$ rails db:create
    ```
  - If you see an error about peer authentication, then you need to [change one or two settings in pg_hba.conf](https://stackoverflow.com/questions/18664074/getting-error-peer-authentication-failed-for-user-postgres-when-trying-to-ge), then try creating the databases again.
- Load the schema into the new database:
    ```sh
    plainreading$ rails db:schema:load
    ```
- Seed the database:
    ```sh
    plainreading$ rails db:seed
    ```

## License

Distributed under the [MIT License](https://opensource.org/licenses/MIT).
