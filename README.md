# Installation

```
git clone git@github.com:OpenDevEd/scopus-sdk.git
cd scopus-sdk
npm install
npm run build
npm link
scopus-cli --help
```

Alternatively, you can use:

```
git clone git@github.com:OpenDevEd/scopus-sdk.git
cd scopus-sdk
npm run setup
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
scopus-cli search --title  climate... AND africa... AND education... --showtitle
```