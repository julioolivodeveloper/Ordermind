declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string
        'ios-src'?: string
        alt?: string
        ar?: boolean | ''
        'ar-modes'?: string
        'auto-rotate'?: boolean | ''
        'camera-controls'?: boolean | ''
        'shadow-intensity'?: string
        exposure?: string
        'environment-image'?: string
        poster?: string
        loading?: string
      },
      HTMLElement
    >
  }
}
