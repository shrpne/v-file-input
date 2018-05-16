<script>
    import throttle from 'lodash-es/throttle';

    // emitted events
    const EVENT_DRAG_START = 'onDragStart';
    const EVENT_DRAG_END = 'onDragEnd';
    const EVENT_ADD = 'onAdd';
    const EVENT_ERROR = 'onError';

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
                let readPromises = [];
                let result = [];
                // чтение каждого файла
                for(let i = 0; i < count; i++) {
                    let file = fileList[i];
                    if (!this.isAcceptedFile(file)) {
                        continue;
                    }
                    let readPromise = this.readData(file).then((dataUrl) => {
                        result[i] = {
                            id: fileId,
                            dataUrl,
                            name: file.name,
                            size: file.size,
                            blob: file,
                        };
                        fileId++;
                    });
                    readPromises.push(readPromise);
                }
                if (!readPromises.length) {
                    return;
                }
                Promise.all(readPromises).then(() => {
                    // передача файлов наверх
                    this.$emit(EVENT_ADD, result);
                });
            },
            /**
             * @param {File|Blob} file
             * @return {Promise<string>} - promise resolves with dataURL
             */
            readData(file) {
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
</script>

<template>
    <input class="file-input" type="file" v-bind:multiple="multiple" v-bind:disabled="disabled" v-bind:accept="accept" v-on:change="onChange">
</template>
