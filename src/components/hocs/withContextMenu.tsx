import React, { useState, useRef, useEffect, ComponentType } from 'react';

interface Props {
  onContextMenu: (event: React.MouseEvent) => void;
}

interface WrapperProps {
  onContextMenu: (event: React.MouseEvent) => void;
  [key: string]: any;
}

function withContextMenu<P extends Props>(WrappedComponent: ComponentType<P>) {
  return function ContextMenuWrapper(props: WrapperProps) {
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuCoords, setContextMenuCoords] = useState({ x: 0, y: 0 });
    const contextMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          contextMenuRef.current &&
          !contextMenuRef.current.contains(event.target as Node)
        ) {
          setContextMenuVisible(false);
        }
      }

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [contextMenuRef]);

    function handleContextMenu(event: React.MouseEvent) {
      event.preventDefault();
      setContextMenuCoords({ x: event.clientX, y: event.clientY });
      setContextMenuVisible(true);
      props.onContextMenu(event);
    }

    return (
      <>
        <WrappedComponent {...(props as P)} onContextMenu={handleContextMenu} />
        {contextMenuVisible && (
          <div
            ref={contextMenuRef}
            className="context-menu"
            style={{ left: contextMenuCoords.x, top: contextMenuCoords.y }}
          >
            {/* context menu items */}
          </div>
        )}
      </>
    );
  };
}

export default withContextMenu;
