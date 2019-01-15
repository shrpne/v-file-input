<script>
    import 'mdn-canvas-to-blob';
    import throttle from 'lodash-es/throttle';

    // emitted events
    const EVENT_DRAG_START = 'on-drag-start';
    const EVENT_DRAG_END = 'on-drag-end';
    const EVENT_ADD = 'on-add';
    const EVENT_ERROR = 'on-error';

    let fileId = 0;
    let isDragOver = false;
    let isDragOverEmitted = false;

    export default {
        props: {
            multiple: {
                type: Boolean,
                default: false
            },
            disabled: {
                type: Boolean,
                default: false,
            },
            accept: {
                type: String,
            },
            maxWidth: {
                type: Number,
            },
            maxHeight: {
                type: Number,
            },
        },
        data() {
            return {
                fileApiError: false,
            };
        },
        computed: {
            /**
             * @returns {Array<string>} - array of mime-types suitable substring check
             */
            acceptedTypes() {
                if (typeof this.accept !== 'string') {
                    return [];
                }
                let types = this.accept.split(',');
                return types
                    // 'image/*' => 'image'
                    .map((type) => type.replace('/*', '').trim())
                    .filter((type) => !!type.length);
            },
            emitDragState() {
                return throttle(() => {
                    if (isDragOver && !isDragOverEmitted && !this.disabled) {
                        this.$emit(EVENT_DRAG_START);
                        isDragOverEmitted = true;

                    } else if (!isDragOver && isDragOverEmitted) {
                        this.$emit(EVENT_DRAG_END);
                        isDragOverEmitted = false;
                    }
                }, 50);
            },
        },
        beforeMount() {
            if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
                this.$emit(EVENT_ERROR);
                this.fileApiError = true;
            }
        },
        mounted() {
            if (this.fileApiError) {
                return;
            }

            // предотвращение замены страницы картинкой
            addEvents(['dragover', 'drop'], this.preventPageReload);

            // drop на все окно
            window.addEventListener('drop', this.onDrop);
            // paste на окно
            window.addEventListener('paste', this.onPaste);

            // уведомление о drag на все окно
            addEvents(['dragenter', 'dragover'], this.onDragEnter);
            addEvents(['dragleave', 'dragend', 'drop'], this.onDragLeave);

            /**
             * Add event listeners to array of events
             * @param {Array<string>} events
             * @param {Function} callback
             */
            function addEvents(events, callback) {
                events.forEach((eventName) => {
                    window.addEventListener(eventName, callback);
                });
            }
        },
        destroyed() {
            if (this.fileApiError) {
                return;
            }

            removeEvents(['dragover', 'drop'], this.preventPageReload);
            window.removeEventListener('drop', this.onDrop);
            window.removeEventListener('paste', this.onPaste);
            removeEvents(['dragenter', 'dragover'], this.onDragEnter);
            removeEvents(['dragleave', 'dragend', 'drop'], this.onDragLeave);

            /**
             * Remove event listeners from array of events
             * @param {Array<string>} events
             * @param {Function} callback
             */
            function removeEvents(events, callback) {
                events.forEach((eventName) => {
                    window.removeEventListener(eventName, callback);
                });
            }
        },

        methods: {
            onChange(e) {
                if (this.fileApiError || this.disabled) {
                    return;
                }
                e.preventDefault();
                this.processFiles(e.target.files);
            },
            onDrop(e) {
                //@TODO drop folder @see https://github.com/lian-yue/vue-upload-component/blob/master/src/FileUpload.vue
                if (this.disabled) {
                    return;
                }
                if (e.dataTransfer.files.length) {
                    this.processFiles(e.dataTransfer.files);
                }
            },
            onPaste(e) {
                if (this.disabled) {
                    return;
                }
                let files = [];
                for (let index in e.clipboardData.items) {
                    let item = e.clipboardData.items[index];
                    if (item.kind === 'file') {
                        files.push(item.getAsFile());
                    }
                }
                if (files.length) {
                    this.processFiles(files);
                }
            },
            onDragEnter() {
                isDragOver = true;
                this.emitDragState();
            },
            onDragLeave() {
                isDragOver = false;
                this.emitDragState();
            },
            preventPageReload(e) {
                e.preventDefault();
            },
            /**
             * @param {FileList} fileList
             */
            processFiles(fileList) {
                let count = this.multiple ? fileList.length : 1;
                let filePromiseList = [];
                let result = [];
                // чтение каждого файла
                for(let i = 0; i < count; i++) {
                    let file = fileList[i];
                    if (!this.isAcceptedFile(file)) {
                        continue;
                    }
                    let filePromise = new Promise((resolve) => {
                        // resize file if needed
                        let dimensionPromise = new Promise((resolveDimension) => {
                            if (file.type.match('image.*') && (this.maxWidth || this.maxHeight)) {
                                resizeImage(file, this.maxWidth, this.maxHeight)
                                    .then(resolveDimension);
                            } else {
                                resolveDimension(file);
                            }
                        });

                        // file have acceptable dimensions
                        dimensionPromise.then((file) => {
                            this.getDataUrlFromBlob(file).then((dataUrl) => {
                                result[i] = {
                                    id: fileId,
                                    dataUrl,
                                    name: file.name,
                                    size: file.size,
                                    type: file.type,
                                    blob: file,
                                };
                                fileId++;
                                resolve();
                            });
                        });
                    });

                    filePromiseList.push(filePromise);
                }
                if (!filePromiseList.length) {
                    return;
                }
                Promise.all(filePromiseList).then(() => {
                    // передача файлов наверх
                    this.$emit(EVENT_ADD, result);
                });
            },
            /**
             * @TODO consider not exposing data url for performance purpose. Users will have to use FileReader or URL.createObjectURL() (https://twitter.com/andrey_sitnik/status/1060157747189170176)
             * @param {File|Blob} file
             * @return {Promise<string>} - promise resolves with dataURL
             */
            getDataUrlFromBlob(file) {
                return new Promise((resolve) => {
                    let reader = new FileReader();
                    reader.onload = (event) => {
                        resolve(event.target.result);
                    };
                    reader.readAsDataURL(file);
                });
            },
            /**
             * Проверяет, что файл соответствует принимаемым mime-type'ам
             * @TODO нет проверки на расширение файла
             * @param {File} file
             * @return {boolean}
             */
            isAcceptedFile(file) {
                if (!this.acceptedTypes.length) {
                    // нет ограничений на типы
                    return true;
                }
                return this.acceptedTypes.some((type) => file.type.indexOf(type) === 0);
            },
        }
    };

    /**
     * Resize File to given dimensions
     * @TODO consider using better resizing algorithm https://stackoverflow.com/a/24775332/4936667 or https://github.com/nodeca/pica
     * @param {File|Blob} file
     * @param {number} maxWidth
     * @param {number} maxHeight
     * @return {Promise<Blob>}
     */
    function resizeImage(file, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            let img = new Image;
            let url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                let canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                let ctx = canvas.getContext("2d");

                getOrientation(file, (orientation) => {
                    drawImage(canvas, ctx, img, width, height, orientation);
                    canvas.toBlob(resolve, file.type);
                });

            };
            img.src = url;
        });
    }

    /**
     * Draw image on canvas according to EXIF orientation data
     * https://stackoverflow.com/a/40867559/4936667
     */
    function drawImage(canvas, ctx, img, width, height, orientation) {
        // set proper canvas dimensions before transform & export
        if (4 < orientation && orientation < 9) {
            // 5-8
            canvas.width = height;
            canvas.height = width;
        } else {
            // 1-4
            canvas.width = width;
            canvas.height = height;
        }

        // transform context before drawing image
        switch (orientation) {
            case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
            case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
            case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
            case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
            case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
            case 7: ctx.transform(0, -1, -1, 0, height, width); break;
            case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
        }

        // draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }


    /**
     * https://stackoverflow.com/a/32490603/4936667
     * @param {File|Blob} file
     * @param {Function<number>} callback
     */
    function getOrientation(file, callback) {
        let reader = new FileReader();
        reader.onload = function (e) {

            let view = new DataView(e.target.result);
            if (view.getUint16(0, false) !== 0xFFD8) {
                return callback(-2);
            }
            let length = view.byteLength, offset = 2;
            while (offset < length) {
                if (view.getUint16(offset + 2, false) <= 8) return callback(-1);
                let marker = view.getUint16(offset, false);
                offset += 2;
                if (marker === 0xFFE1) {
                    if (view.getUint32(offset += 2, false) !== 0x45786966) {
                        return callback(-1);
                    }

                    let little = view.getUint16(offset += 6, false) === 0x4949;
                    offset += view.getUint32(offset + 4, little);
                    let tags = view.getUint16(offset, little);
                    offset += 2;
                    for (let i = 0; i < tags; i++) {
                        if (view.getUint16(offset + (i * 12), little) === 0x0112) {
                            return callback(view.getUint16(offset + (i * 12) + 8, little));
                        }
                    }
                } else if ((marker & 0xFF00) !== 0xFF00) {
                    break;
                } else {
                    offset += view.getUint16(offset, false);
                }
            }
            return callback(-1);
        };
        reader.readAsArrayBuffer(file);
    }
</script>

<template>
    <input class="file-input" type="file" v-bind:multiple="multiple" v-bind:disabled="disabled" v-bind:accept="accept" v-on:change="onChange">
</template>
