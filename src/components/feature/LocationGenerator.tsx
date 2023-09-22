import React, { useState } from 'react';
import Modal from '../Modal';

const LocationGenerator = () => {
  const [open, setOpen] = useState(false);
  return ( false ?
    <div>
      <Modal
        title="Warehouse Generator"
        open={open}
        onClose={() => setOpen(false)}
        
      ></Modal>
      <button onClick={() => setOpen(true)} className="btn ">
        Warehouse Generator
      </button>
    </div>: <></>
  );
};

export default LocationGenerator;
