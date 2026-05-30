import { useEffect, useRef } from "react";

export function useOutsideClick(handler, listenCapturing = true) {
  const ref = useRef();

  useEffect(
    function () {
      function handleClick(e) {
        if (ref.current && !ref.current.contains(e.target)) {
          handler();
        }
      }

      document.addEventListener("click", handleClick, listenCapturing); // true(listenCapturing true or false dynamically) is added to capture the event in the capturing phase, which means it will be triggered before the event is propagated to the children elements. This is important because we want to close the modal before any other click events are triggered on the children elements.

      return () =>
        document.removeEventListener("click", handleClick, listenCapturing);
    },
    [handler, listenCapturing],
  );

  return ref; 
}
