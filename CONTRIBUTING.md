# Contributing

Thanks for reaching the project and wanting to improve the extension! This file has few guidelines that will help you along the way.

## Code of Conduct

Please, make sure you read the [Code of Conduct](CODE-OF-CONDUCT.md) file before contributing! It is short, it will not take you much time :wink:!

## How to

### Issue

The first thing would be to create an issue, which would notify the contributors. Furthermore, it gives more visibility to the problem or feature and may attract other people on helping. You can propose a solution to the issue by creating a pull request. If you do not feel like contributing, no worries, a maintainer will come to help!

### Developing

When developing, make sure to following the below steps:

1. Fork the repository.
2. Clone the repository to your local machine, adding the original repo as an upstream remote:

```sh
git clone git@github:<your-name>/dartBarrelFileGenerator.git
# You can also use https
# git clone https://github.com/<your-name>/dartBarrelFileGenereator.git
cd dartBarrelFileGenerator
git remote add upstream https://github.com/mikededo/dartBarrelFileGenerator.git
```

3. Synchronize the branch:

```sh
git checkout main
git pull upstream main
```

4. Install all the dependencies:

```sh
yarn
```

5. Create the new branch:

```sh
git checkout -b branch-with-sense
```

6. Save changes and push to your fork:

```sh
git push -u origin HEAD
```

7. Create a pull request with your changes. Make sure that your base branch is set to `next`, not `main`.

#### Commits

The repository uses semantic commits, since it generates the changelog automatically. Whenever you commit your changes, husky will run the git hooks which will:

1. Check for the linting, using ESLint (see the [config file](.eslintrc.json)).
2. Check for the style and fixing it, using Prettier (see the [config file](.prettierrc)).
3. Prompt you with the commitizen CLI tool. See the semantic commits [documentation](https://www.conventionalcommits.org/en/v1.0.0/) for more info.

#### Merging a PR

After your code has been reviewed and approved, one of the administrators will squash the changes to the base branch.

## License

By contributing your code to this repository, you agree to license your contribution under the [MIT License](LICENSE).
