<script setup lang="ts">
import { ref, computed, onBeforeMount, onMounted, onUnmounted } from 'vue';
import 'mdn-canvas-to-blob';
import { throttle } from 'es-toolkit';


let fileId = 0;
let isDragOver = false;
let isDragOverEmitted = false;

type Props = {
    multiple?: boolean;
    disabled?: boolean;
    accept?: string;
    maxWidth?: number;
    maxHeight?: number;
};

const props = defineProps<Props>();

type EmitEvents = {
    'drag-start': [];
    'drag-end': [];
    'add': [Array<FileData>];
    'error': [];
};

const emit = defineEmits<EmitEvents>();

const fileApiError = ref(false);

/**
 * @returns {Array<string>} - array of mime-types suitable substring check
 */
const acceptedTypes = computed(() => {
    if (typeof props.accept !== 'string') {
        return [];
    }
    let types = props.accept.split(',');
    return types
        // 'image/*' => 'image'
        .map((type) => type.replace('/*', '').trim())
        .filter((type) => !!type.length);
});

const emitDragState = computed(() => {
    return throttle(() => {
        if (isDragOver && !isDragOverEmitted && !props.disabled) {
            emit('drag-start');
            isDragOverEmitted = true;
        } else if (!isDragOver && isDragOverEmitted) {
            emit('drag-end');
            isDragOverEmitted = false;
        }
    }, 50);
});

onBeforeMount(() => {
    if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
        emit('error');
        fileApiError.value = true;
    }
});

onMounted(() => {
    if (fileApiError.value) {
        return;
    }

    // предотвращение замены страницы картинкой
    addEvents(['dragover', 'drop'], preventPageReload);

    // drop на все окно
    window.addEventListener('drop', onDrop);
    // paste на окно
    window.addEventListener('paste', onPaste);

    // уведомление о drag на все окно
    addEvents(['dragenter', 'dragover'], onDragEnter);
    addEvents(['dragleave', 'dragend', 'drop'], onDragLeave);

    /**
     * Add event listeners to array of events
     * @param {Array<string>} events
     * @param {Function} callback
     */
    function addEvents(events: string[], callback: (Event) => void) {
        events.forEach((eventName) => {
            window.addEventListener(eventName, callback);
        });
    }
});

onUnmounted(() => {
    if (fileApiError.value) {
        return;
    }

    removeEvents(['dragover', 'drop'], preventPageReload);
    window.removeEventListener('drop', onDrop);
    window.removeEventListener('paste', onPaste);
    removeEvents(['dragenter', 'dragover'], onDragEnter);
    removeEvents(['dragleave', 'dragend', 'drop'], onDragLeave);

    /**
     * Remove event listeners from array of events
     * @param {Array<string>} events
     * @param {Function} callback
     */
    function removeEvents(events: string[], callback: (Event) => void) {
        events.forEach((eventName) => {
            window.removeEventListener(eventName, callback);
        });
    }
});


function onChange(e: Event) {
    if (!(e.target instanceof HTMLInputElement)) {
        return;
    }
    if (fileApiError.value || props.disabled) {
        return;
    }
    e.preventDefault();
    processFiles(e.target.files);
}

function onDrop(e: DragEvent) {
    //@TODO drop folder @see https://github.com/lian-yue/vue-upload-component/blob/master/src/FileUpload.vue
    if (props.disabled) {
        return;
    }
    if (e.dataTransfer.files.length) {
        processFiles(e.dataTransfer.files);
    }
}

function onPaste(e: ClipboardEvent) {
    if (props.disabled) {
        return;
    }
    /** @type {Array<File>} */
    let files: Array<File> = [];
    for (let index in e.clipboardData.items) {
        let item = e.clipboardData.items[index];
        if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
                files.push(file);
            }
        }
    }
    if (files.length) {
        processFiles(files);
    }
}

function onDragEnter() {
    isDragOver = true;
    emitDragState.value();
}

function onDragLeave() {
    isDragOver = false;
    emitDragState.value();
}

function preventPageReload(e: Event) {
    e.preventDefault();
}

type FileData = {
    id: number;
    dataUrl: string;
    name: string;
    size: number;
    type: string;
    blob: Blob;
}

/**
 * @param {FileList|Array<File>} fileList
 */
async function processFiles(fileList: FileList | File[]): Promise<void> {
    let count = props.multiple ? fileList.length : 1;
    /**
     * @type {Array<FileData>}
     */
    let result: FileData[] = [];
    // чтение каждого файла
    for (let i = 0; i < count; i++) {
        let file = fileList[i];
        if (!isAcceptedFile(file)) {
            continue;
        }
        let blob: Blob = file;
        // resize file if needed
        if (file.type.match('image.*') && (props.maxWidth || props.maxHeight)) {
            blob = await resizeImage(file, props.maxWidth, props.maxHeight);
        }

        // file have acceptable dimensions
        const dataUrl = await getDataUrlFromBlob(blob);
        result[i] = {
            id: fileId,
            dataUrl,
            name: file.name,
            size: blob.size,
            type: blob.type,
            blob: blob,
        };
        fileId += 1;
    }
    if (!result.length) {
        return;
    }
    // передача файлов наверх
    emit('add', result);
}

/**
 * @TODO consider not exposing data url for performance purpose. Users will have to use FileReader or URL.createObjectURL() (https://twitter.com/andrey_sitnik/status/1060157747189170176)
 * @param {File|Blob} file
 * @return {Promise<string>} - promise resolves with dataURL
 */
function getDataUrlFromBlob(file: File | Blob): Promise<string> {
    return readFile(file, 'DataURL');
}

function readFile(file: File | Blob, type: 'DataURL'): Promise<string>;
function readFile(file: File | Blob, type: 'ArrayBuffer'): Promise<ArrayBuffer>;
function readFile(file: File | Blob, type: 'ArrayBuffer' | 'DataURL'): Promise<string | ArrayBuffer> {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = (event) => {
            // if (typeof event.target.result !== 'string') {
            //     reject(new Error('FileReader result is not a string'));
            // }
            resolve(event.target.result);
        };
        reader.onerror = reject;
        if (type === 'DataURL') {
            reader.readAsDataURL(file);
        } else if (type === 'ArrayBuffer') {
            reader.readAsArrayBuffer(file);
        }
    });
}

/**
 * Проверяет, что файл соответствует принимаемым mime-type'ам
 * @TODO нет проверки на расширение файла
 * @param {File} file
 * @return {boolean}
 */
function isAcceptedFile(file: File): boolean {
    if (!acceptedTypes.value.length) {
        // нет ограничений на типы
        return true;
    }
    return acceptedTypes.value.some((type) => file.type.indexOf(type) === 0);
}

/**
 * Resize File to given dimensions
 * @TODO consider using better resizing algorithm https://stackoverflow.com/a/24775332/4936667 or https://github.com/nodeca/pica
 * @param {File} file
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @return {Promise<Blob>}
 */
function resizeImage(file: File, maxWidth?: number, maxHeight?: number): Promise<Blob> {
    return new Promise((resolve) => {
        let img = new Image;
        let url = URL.createObjectURL(file);
        img.onload = async () => {
            URL.revokeObjectURL(url);
            let width = img.width;
            let height = img.height;

            let scale = 1;
            if (width > height) {
                if (width > maxWidth) {
                    scale = maxWidth / width;
                }
            } else {
                if (height > maxHeight) {
                    scale = maxHeight / height;
                }
            }
            if (scale === 1) {
                resolve(file);
                return;
            }

            let canvas = document.createElement("canvas");
            let ctx = canvas.getContext("2d");

            const orientation = await getOrientation(file);
            drawImage(canvas, ctx, img, width, height, orientation, scale);
            canvas.toBlob(resolve, file.type);
        };
        img.src = url;
    });
}

/**
 * Draw image on canvas according to EXIF orientation data
 * https://stackoverflow.com/a/40867559/4936667
 */
function drawImage(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number, orientation: number, scale: number) {
    // set proper canvas dimensions before transform & export
    if (4 < orientation && orientation < 9) {
        // 5-8
        canvas.width = height * scale;
        canvas.height = width * scale;
    } else {
        // 1-4
        canvas.width = width * scale;
        canvas.height = height * scale;
    }

    // transform context before drawing image
    ctx.scale(scale, scale);
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
    ctx.drawImage(img, 0, 0);
}


/**
 * https://stackoverflow.com/a/32490603/4936667
 */
async function getOrientation(file: File | Blob): Promise<number> {
    const data = await readFile(file, 'ArrayBuffer');
    let view = new DataView(data);
    if (view.getUint16(0, false) !== 0xFFD8) {
        return -2;
    }
    let length = view.byteLength, offset = 2;
    while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) {
            return -1;
        }
        let marker = view.getUint16(offset, false);
        offset += 2;
        if (marker === 0xFFE1) {
            if (view.getUint32(offset += 2, false) !== 0x45786966) {
                return -1;
            }

            let little = view.getUint16(offset += 6, false) === 0x4949;
            offset += view.getUint32(offset + 4, little);
            let tags = view.getUint16(offset, little);
            offset += 2;
            for (let i = 0; i < tags; i++) {
                if (view.getUint16(offset + (i * 12), little) === 0x0112) {
                    return view.getUint16(offset + (i * 12) + 8, little);
                }
            }
        } else if ((marker & 0xFF00) !== 0xFF00) {
            break;
        } else {
            offset += view.getUint16(offset, false);
        }
    }
    return -1;
}
</script>

<template>
    <input
        class="file-input"
        type="file"
        :multiple="multiple"
        :disabled="disabled"
        :accept="accept"
        @change="onChange"
    >
</template>
