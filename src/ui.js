import buttonIcon from './svg/button-icon.svg';
import { loadJS } from './utils';
// import interact from 'interactjs';

const resizeScript = 'https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js';
const zoomScript = 'https://cdn.jsdelivr.net/npm/medium-zoom@1.0.4/dist/medium-zoom.min.js';

/**
 * Class for working with UI:
 *  - rendering base structure
 *  - show/hide preview
 *  - apply tune view
 */
export default class Ui {
  /**
   * @param {object} api - Editor.js API
   * @param {ImageConfig} config - user config
   * @param {function} onSelectFile - callback for clicks on Select file buttor
   */
  constructor({ api, config, onSelectFile }) {
    this.api = api;
    this.config = config;
    this.onSelectFile = onSelectFile;
    this.nodes = {
      wrapper: make('div', [this.CSS.baseClass, this.CSS.wrapper]),
      imageContainer: make('div', [ this.CSS.imageContainer ]),
      fileButton: this.createFileButton(),
      imageWrapper: undefined,
      imageTopLeftDragger: undefined,
      imageTopRightDragger: undefined,
      imageInfoLabel: undefined,
      imageBottomLeftDragger: undefined,
      imageBottomRightDragger: undefined,
      imageEl: undefined,
      imagePreloader: make('div', this.CSS.imagePreloader),
      caption: make('div', [this.CSS.input, this.CSS.caption], {
        contentEditable: true
      })
    };
    /**
     * zoom iamge like medium
     *
    */
    this.imageZoomer = null;

    /**
     * image ratio, to keep image shape when resize
    */
    this.imageRatio = 1;

    /**
     * Create base structure
     *  <wrapper>
     *    <image-container>
     *      <image-preloader />
     *    </image-container>
     *    <caption />
     *    <select-file-button />
     *  </wrapper>
     */
    this.nodes.caption.dataset.placeholder = this.config.captionPlaceholder;
    this.nodes.imageContainer.appendChild(this.nodes.imagePreloader);
    this.nodes.wrapper.appendChild(this.nodes.imageContainer);
    this.nodes.wrapper.appendChild(this.nodes.caption);
    this.nodes.wrapper.appendChild(this.nodes.fileButton);
  }

  /**
   * CSS classes
   * @constructor
   */
  get CSS() {
    return {
      baseClass: this.api.styles.block,
      loading: this.api.styles.loader,
      input: this.api.styles.input,
      button: this.api.styles.button,

      /**
       * Tool's classes
       */
      wrapper: 'image-tool',
      imageContainer: 'image-tool__image',
      imagePreloader: 'image-tool__image-preloader',
      imageWrapper: 'image-tool__image-wrapper',
      imageInfoLabel: 'image-tool__image-wrapper-infolabel',
      imageTopLeftDragger: 'image-tool__image-wrapper-topleft-dragger',
      imageTopRightDragger: 'image-tool__image-wrapper-topright-dragger',
      imageBottomLeftDragger: 'image-tool__image-wrapper-bottomleft-dragger',
      imageBottomRightDragger: 'image-tool__image-wrapper-bottomright-dragger',
      imageEl: 'image-tool__image-picture',
      caption: 'image-tool__caption'
    };
  };

  /**
   * Ui statuses:
   * - empty
   * - uploading
   * - filled
   * @return {{EMPTY: string, UPLOADING: string, FILLED: string}}
   */
  static get status() {
    return {
      EMPTY: 'empty',
      UPLOADING: 'loading',
      FILLED: 'filled'
    };
  }

  /**
   * @param {ImageToolData} toolData
   * @return {HTMLDivElement}
   */
  render(toolData) {
    if (!toolData.file || Object.keys(toolData.file).length === 0) {
      this.toggleStatus(Ui.status.EMPTY);
    } else {
      this.toggleStatus(Ui.status.UPLOADING);
    }

    return this.nodes.wrapper;
  }

  /**
   * Creates upload-file button
   * @return {Element}
   */
  createFileButton() {
    let button = make('div', [ this.CSS.button ]);

    button.innerHTML = this.config.buttonContent || `${buttonIcon} Select an Image`;

    button.addEventListener('click', () => {
      this.onSelectFile();
    });

    return button;
  }

  /**
   * Shows uploading preloader
   * @param {string} src - preview source
   */
  showPreloader(src) {
    this.nodes.imagePreloader.style.backgroundImage = `url(${src})`;

    this.toggleStatus(Ui.status.UPLOADING);
  }

  /**
   * Hide uploading preloader
   */
  hidePreloader() {
    this.nodes.imagePreloader.style.backgroundImage = '';
    this.toggleStatus(Ui.status.EMPTY);
  }

  /**
   * Shows an image
   * @param {string} url
   */
  fillImage(url) {
    /**
     * Check for a source extension to compose element correctly: video tag for mp4, img — for others
     */
    const tag = 'IMG';

    let attributes = {
      src: url
    };

    /**
     * Compose tag with defined attributes
     * @type {Element}
     */
    this.nodes.imageWrapper = make('DIV', this.CSS.imageWrapper, {});
    this.nodes.imageInfoLabel = make('DIV', this.CSS.imageInfoLabel, {});
    this.nodes.imageTopLeftDragger = make('DIV', this.CSS.imageTopLeftDragger, {});
    this.nodes.imageTopRightDragger = make('DIV', this.CSS.imageTopRightDragger, {});
    this.nodes.imageBottomLeftDragger = make('DIV', this.CSS.imageBottomLeftDragger, {});
    this.nodes.imageBottomRightDragger = make('DIV', this.CSS.imageBottomRightDragger, {});
    this.nodes.imageEl = make(tag, this.CSS.imageEl, attributes);

    /**
     * Add load event listener
     */
    this.nodes.imageEl.addEventListener('load', this.imageOnLoad.bind(this));
    this.nodes.imageEl.addEventListener('click', this.imageOnClick.bind(this));

    /**
     * Add resize event listener
    */
    this.nodes.imageWrapper.appendChild(this.nodes.imageTopLeftDragger);
    this.nodes.imageWrapper.appendChild(this.nodes.imageInfoLabel);
    this.nodes.imageWrapper.appendChild(this.nodes.imageTopRightDragger);
    this.nodes.imageWrapper.appendChild(this.nodes.imageBottomLeftDragger);
    this.nodes.imageWrapper.appendChild(this.nodes.imageBottomRightDragger);
    this.nodes.imageWrapper.appendChild(this.nodes.imageEl);
    this.nodes.imageContainer.appendChild(this.nodes.imageWrapper);
    // this.nodes.imageContainer.appendChild(this.nodes.imageEl);
  }

  /**
   * image on load handler
   * init resize handler inside
  */
  imageOnLoad() {
    loadJS(resizeScript, this.initResizeHandler.bind(this), document.body);
    loadJS(zoomScript, this.initZoomHandler.bind(this), document.body);

    this.toggleStatus(Ui.status.FILLED);
    // eslint-disable-next-line no-undef

    /**
     * Preloader does not exists on first rendering with presaved data
     */
    if (this.nodes.imagePreloader) {
      this.nodes.imagePreloader.style.backgroundImage = '';
    }
  }

  /**
   * NOTE:  this is an hack solution
   * the resize event will triggle click event after dragend
   * resize 在 end 的时候会误触发 click, 导致 zoom 被激活
  */
  imageOnClick() {
    const labelOpacity = this.nodes.imageInfoLabel.style.opacity;

    if (!labelOpacity || labelOpacity === '0') {
      if (this.imageZoomer) this.imageZoomer.toggle();
    }
  }

  /**
   * init zoom picture
   *
   * @memberof Ui
   */
  initZoomHandler() {
    // eslint-disable-next-line no-undef
    this.imageZoomer = mediumZoom(this.nodes.imageEl);
  }
  /**
   * resize the picture
   */
  initResizeHandler() {
    this.imageRatio = this.nodes.imageEl.height / this.nodes.imageEl.width;
    let labelInfoTimer = null;

    // eslint-disable-next-line no-undef
    interact(this.nodes.imageEl)
      .resizable({
        edges: {
          top: true, // Use pointer coords to check for resize.
          left: true, // Disable resizing from left edge.
          bottom: true, // Resize if pointer target matches selector
          right: true
        }
      })
      .on('resizestart', () => {
        this.nodes.imageEl.style.opacity = 0.9;
        if (labelInfoTimer) clearTimeout(labelInfoTimer);
        this.nodes.imageInfoLabel.style.opacity = 1;
      })
      .on('resizeend', (event) => {
        this.nodes.imageEl.style.opacity = 1;
        labelInfoTimer = setTimeout(() => {
          this.nodes.imageInfoLabel.style.opacity = 0;
        }, 500);
        event.stopPropagation();
      })
      .on('resizemove', event => {
        let { x, y } = event.target.dataset;
        const maxWidth = event.target.parentElement.parentElement.clientWidth;

        x = parseFloat(x) || 0;
        y = parseFloat(y) || 0;

        // TODO:  先要看是竖的还是横的
        // const radio = event.target.height / event.target.width

        const dragWidth = event.rect.width <= maxWidth ? event.rect.width : maxWidth;
        const dragHeight = dragWidth * this.imageRatio;

        this.nodes.imageInfoLabel.innerHTML = this.labelInfoHTML(dragHeight, dragWidth);

        // `h: ${parseInt(dragHeight)} px / w: ${parseInt(dragWidth)} px`
        Object.assign(event.target.style, {
          width: `${dragWidth}px`,
          height: `${dragHeight}px`,
          transform: `translate(${event.deltaRect.left}px, ${event.deltaRect.top}px)`
        });

        Object.assign(event.target.dataset, { x, y });
      });
  }

  /**
   * labelInfoHTML pices
   * @param {string} height - current drag height of the image
   * @param {string} width - current drag width of the image
   */
  labelInfoHTML(height, width) {
    return '<span class="opacity-08">h:&nbsp;</span>' + parseInt(height) + '<span class="opacity-08">&nbsp;px</span>' + '&nbsp;&nbsp;/&nbsp;&nbsp;' +
    '<span class="opacity-08">w:&nbsp;</span>' + parseInt(width) + '<span class="opacity-08">&nbsp;px</span>';
  }

  /**
   * Shows caption input
   * @param {string} text - caption text
   */
  fillCaption(text) {
    if (this.nodes.caption) {
      this.nodes.caption.innerHTML = text;
    }
  }

  /**
   * Changes UI status
   * @param {string} status - see {@link Ui.status} constants
   */
  toggleStatus(status) {
    for (const statusType in Ui.status) {
      if (Ui.status.hasOwnProperty(statusType)) {
        this.nodes.wrapper.classList.toggle(`${this.CSS.wrapper}--${Ui.status[statusType]}`, status === Ui.status[statusType]);
      }
    }
  }

  /**
   * Apply visual representation of activated tune
   * @param {string} tuneName - one of available tunes {@link Tunes.tunes}
   * @param {boolean} status - true for enable, false for disable
   */
  applyTune(tuneName, status) {
    this.nodes.wrapper.classList.toggle(`${this.CSS.wrapper}--${tuneName}`, status);
  }
}

/**
 * Helper for making Elements with attributes
 *
 * @param  {string} tagName           - new Element tag name
 * @param  {array|string} classNames  - list or name of CSS class
 * @param  {Object} attributes        - any attributes
 * @return {Element}
 */
export const make = function make(tagName, classNames = null, attributes = {}) {
  let el = document.createElement(tagName);

  if (Array.isArray(classNames)) {
    el.classList.add(...classNames);
  } else if (classNames) {
    el.classList.add(classNames);
  }

  for (let attrName in attributes) {
    el[attrName] = attributes[attrName];
  }

  return el;
};
