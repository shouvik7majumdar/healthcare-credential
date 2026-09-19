/// <reference types="next" />
/// <reference types="next/types/global" />
/// <reference types="next/image-types/global" />

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
