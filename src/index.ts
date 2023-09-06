import { useState, useMemo, useEffect, useRef } from "react";
import Block, {
  BlockFactory,
  BlockInstanceOptions,
  RecursivePartial,
  isBlock,
} from "logic-block";

type OnUpdateFunction<T> = BlockInstanceOptions<T>["handleUpdate"];

export const makeCleanBlockCopy = <T>(block: BlockFactory<T>) => {
  const scheme = block.__getScheme();

  const clearScheme = (schemeObj = scheme) => {
    return Object.keys(schemeObj).reduce((acc, key) => {
      const reducer = schemeObj[key];

      if (isBlock(reducer)) {
        acc[key] = makeCleanBlockCopy(reducer);
      } else if (typeof reducer === "object" && reducer !== null) {
        acc[key] = clearScheme(reducer);
      } else {
        acc[key] = reducer;
      }

      return acc;
    }, {});
  };

  return Block(clearScheme());
};

const handlers = <T>() => {
  let id = 0;
  let callbacks: { [x: string]: OnUpdateFunction<T> } = {};
  return {
    add(cb: OnUpdateFunction<T>) {
      id += 1;
      callbacks[id] = cb;
      return id;
    },
    cancel(id) {
      callbacks[id] = undefined;
    },
    clear() {
      callbacks = {};
    },
    callback(arg: T) {
      Object.values(callbacks).forEach((cb) => cb && cb(arg));
    },
  };
};

function useMemoEx(reducerFn, deps) {
  const lastValue = useRef();
  return useMemo(() => {
    const newValue = reducerFn(lastValue.current);
    lastValue.current = newValue;
    return newValue;
  }, deps);
}

export default function useLogicBlock<T>(
  block: BlockFactory<T>,
  initialValue?: T,
  onUpdate?: OnUpdateFunction<T>
): {
  value: T;
  update: (
    newValue: RecursivePartial<T> | ((currentValue: T) => RecursivePartial<T>)
  ) => void;
} {
  const [value, setValue] = useState<T>();

  const handleUpdate = useMemoEx(
    (prevCb) => {
      if (prevCb !== undefined) {
        prevCb.clear();
      }

      const cb = handlers<T>();
      if (onUpdate) {
        cb.add(onUpdate);
      }

      cb.add((...args) => {
        setValue(...args);
      });

      return cb;
    },
    [block, onUpdate]
  );

  const startValue = useMemo(() => {
    const dummyBlock = makeCleanBlockCopy(block);

    return dummyBlock({
      ...value,
      ...initialValue,
    })();
  }, [block]);
  const instance = useMemo(() => {
    return block(
      {
        ...value,
        ...initialValue,
      },
      {
        handleUpdate: handleUpdate.callback,
      }
    );
  }, [block, initialValue]);

  useEffect(() => {
    setValue(instance());
  }, [instance]);

  return {
    value: typeof value !== "undefined" ? value : startValue,

    update(...args) {
      const newValue = instance(...args);
      setValue(newValue);
      return newValue;
    },
  };
}
