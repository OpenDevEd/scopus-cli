# Installation

```
git clone git@github.com:OpenDevEd/scopus-cli.git
cd scopus-cli
npm install
npm run build
npm link
scopus-cli --help
```

Alternatively, you can use:

```
git clone git@github.com:OpenDevEd/scopus-cli.git
cd scopus-cli
npm run setup
scopus-cli --help
```

If you do not use `npm link`, you need to use `npm run start --` instead of `scopus-cli` below.

# Configuration

When running the `scopus-cli` command for the first time, you will be prompted to enter your Scopus API key. This key will be stored in a file named `.config/scopus-cli/scopus-api-key.txt` in your home directory.

# Usage

Search scopus and display json:

```
scopus-cli search climate AND africa AND education
```

Search for matches only in the title:

```
scopus-cli search --title  climate AND africa AND education
```

Search for matches only in the title and abstract and keywords:

```
scopus-cli search --title-abs  climate AND africa AND education
```

Search Scopus using scopus query language:

```
scopus-cli search --query  TITLE-ABS-KEY(climate AND africa AND education)
```

Search scopus and display number of results:

```
scopus-cli search --title  climate AND africa AND education --count
```

Search scopus and save output:

```
scopus-cli search --title  climate AND africa AND education --save output
```

Search scopus and automatically save output,
the output is saved in a file named `<Datetime>-<Search Query>`:

```
scopus-cli search --title  climate AND africa AND education --autosave
```

Expand search terms according to searches stored in text files in `searchterms/`:

```
scopus-cli search --title  climate... AND africa... AND education...
```

Setup new api key:

```
scopus-cli config set api-key
```

Test Key capabilities:

```
scopus-cli search --title  climate AND africa AND education --keyinfo
```

Fetch all results from a search:

```
scopus-cli search --title  climate AND africa AND education --allpages
```

Fetch all results from a search and save them in chunks:

```
scopus-cli search --title  climate AND africa AND education --allpages --save out --chunkSize 1000
```

Fetch a number of results from a search:

```
scopus-cli search --title  climate AND africa AND education --limit 100
```

Fetch results for a specific date range:

- from start to 2020
```
scopus-cli search --title  climate AND africa AND education --date -2020
```

- from 2019 to 2020
```
scopus-cli search --title  climate AND africa AND education --date 2019-2020
```

- from 2019 to now
```
scopus-cli search --title  climate AND africa AND education --date 2019-
```

- only 2020
```
scopus-cli search --title  climate AND africa AND education --date 2020
```

Fetch abstract from a specific scopus id:

```
scopus-cli abstract <SCOPUS_ID> <SCOPUS_ID> <SCOPUS_ID> ...
```

Fetch abstract from a specific scopus id and save them in a file:

```
scopus-cli abstract <SCOPUS_ID> <SCOPUS_ID> <SCOPUS_ID> ... --save output
```

