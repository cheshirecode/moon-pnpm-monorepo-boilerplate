import React, { useEffect, useState } from 'react';

const DummyCompWithError = ({ onChange }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    onChange(value);
  }, [value]);

  return <input value={value} type="text" onChange={(e) => setValue(e.target.value)}></input>;
};

export default DummyCompWithError;
