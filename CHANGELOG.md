# Changelog

The following highlights the changes that have been rolled with each new release.

Some guidelines in reading this document:

* The `[new release]` section corresponds to all the changes that have been merged into master, but have not yet been packaged and released.
* Every other release as it's section hose title is the tag of the release.
* The changes on each release are a list of Pull Requests (PRs) which were merged into master. For every PR we have the short summary followed by a link to the actual merged PR page. Inside the PR are the detailed changes.
* Being that these are the early days of the repository, we have some code changes that were added directly and without much detail, for these we have a link to the commit instead of the PR.

## [new release]

* Implements reducer tests ([#6](https://github.com/log-oscon/redux-wpapi/pull/6))
* Draft on Contributions and the introduction of this `CHANGELOG.md` file ([#5](https://github.com/log-oscon/redux-wpapi/pull/5))
* Fix FAILURE handling ([#3](https://github.com/log-oscon/redux-wpapi/pull/3))

## 0.1.2

* Fix module identification name in code ([#2](https://github.com/log-oscon/redux-wpapi/pull/2))
* Correct README.md ([#1](https://github.com/log-oscon/redux-wpapi/pull/1))
* Fix documentation render function ([b0bb5f4](https://github.com/log-oscon/redux-wpapi/commit/b0bb5f417d6943c981346cf74b912efa67a7c9b6))

## 0.1.1

* Include current page in the merge of selectQuery ([ca2c03c](https://github.com/log-oscon/redux-wpapi/commit/ca2c03cd4e337a58ef61e9e154223ff95acbd0de))

## 0.1.0

First version of redux-wpapi, already functional, but poorly documented.

Includes the reducer tests for the actions:

* `REDUX_WP_API_REQUEST` (get, create, update and delete)
* `REDUX_WP_API_SUCCESS` (get)