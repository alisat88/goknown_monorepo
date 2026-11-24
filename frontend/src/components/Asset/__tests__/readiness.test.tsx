import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import Asset from '..';
jest.mock('pdf-viewer-reactjs', () => () => null);
jest.mock('react-modal-image', () => (props: any) => <img src={props.small} alt={props.alt} />);
jest.mock('react-audio-viz', () => ({ useVisualizer: () => [null, jest.fn()], models: {} }));
jest.mock('react-pdf', () => ({ pdfjs: { GlobalWorkerOptions: {} },
  Document: ({ children }: any) => <div>{children}</div>,
  Page: ({ onRenderSuccess, onRenderError }: any) => <div><button onClick={onRenderSuccess}>rendered</button><button onClick={onRenderError}>failed</button></div>,
}));
test('image thumbnails never signal preview readiness', () => {
  const ready = jest.fn(); const { getByRole } = render(<Asset type="image/png" url="/image" name="asset" onReady={ready} />);
  const img = getByRole('img'); Object.defineProperty(img, 'naturalWidth', { value: 100 }); fireEvent.load(img);
  expect(ready).not.toHaveBeenCalled();
});
test('actual image load signals readiness, error does not', () => {
  const ready = jest.fn(), error = jest.fn();
  const { getByRole } = render(<Asset component="preview" type="image/png" url="/image" name="asset" onReady={ready} onViewerError={error} />);
  const img = getByRole('img'); expect(ready).not.toHaveBeenCalled(); fireEvent.error(img);
  expect(error).toHaveBeenCalled(); expect(ready).not.toHaveBeenCalled();
  Object.defineProperty(img, 'naturalWidth', { value: 100 }); fireEvent.load(img); expect(ready).toHaveBeenCalledTimes(1);
});
test.each(['video/mp4', 'audio/mpeg'] as const)('%s uses loaded media data', type => {
  const ready = jest.fn(); const { container } = render(<Asset component="preview" type={type} url="/media" name="asset" onReady={ready} />);
  expect(ready).not.toHaveBeenCalled(); fireEvent.loadedData(container.querySelector('video, audio')!); expect(ready).toHaveBeenCalledTimes(1);
});
test('PDF readiness waits for rendered page, not metadata alone', () => {
  const ready = jest.fn(), error = jest.fn();
  const view = render(<Asset component="preview" type="application/pdf" url="/document" name="asset" onReady={ready} onViewerError={error} />);
  expect(ready).not.toHaveBeenCalled(); fireEvent.click(view.getByText('failed')); expect(error).toHaveBeenCalled();
  fireEvent.click(view.getByText('rendered')); expect(ready).toHaveBeenCalledTimes(1);
});
