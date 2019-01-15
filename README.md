# v-file-input

[![npm](https://img.shields.io/npm/v/v-file-input.svg)](https://www.npmjs.com/package/v-file-input) [![vue2](https://img.shields.io/badge/vue-2.x-brightgreen.svg)](https://vuejs.org/)

Simple Vue.js file input component. 

## Installation

```bash
npm install --save v-file-input
```

## Usage

### Init with bundler (Webpack, Rollup)

```js
// As plugin
import Vue from 'vue'
import VFileInput from 'v-file-input'

Vue.use(VFileInput)

// As component
```

### Init in browser

```html
<!-- Include after Vue -->
<!-- Local files -->
<script src="v-file-input/dist/v-file-input.js"></script>

<!-- OR -->

<!-- From CDN -->
<script src="https://unpkg.com/v-file-input"></script>
```

### Example

```html
<file-input
    :multiple="true"
    :disabled="false"
    :max-width="200"
    :max-height="200"
    @on-add="addFiles"
    @on-error="showFileApiError"
    @on-drag-start="showDragNotice"
    @on-drag-end="hideDragNotice"
></file-input>
```

[Full example](https://github.com/shrpne/v-file-input/blob/master/example/index.html)

## Development

### Launch visual tests

```bash
npm run dev
```

### Launch Karma with coverage

```bash
npm run dev:coverage
```

### Build

Bundle the js and css of to the `dist` folder:

```bash
npm run build
```


## Publishing

The `prepublish` hook will ensure dist files are created before publishing. This
way you don't need to commit them in your repository.

```bash
# Bump the version first
# It'll also commit it and create a tag
npm version
# Push the bumped package and tags
git push --follow-tags
# Ship it 🚀
npm publish
```

## License

[MIT](http://opensource.org/licenses/MIT)
