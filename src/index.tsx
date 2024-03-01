import React from 'react';

function useWindowSize() {
    const [size, setSize] = React.useState([0, 0]);
    React.useLayoutEffect(() => {
      function updateSize() {
        setSize([window.innerWidth, window.innerHeight]);
      }
      window.addEventListener('resize', updateSize);
      updateSize();
      return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
  }
  
const ReactContext = React.createContext<{
    framePixels?: {
        height: number,
        width: number
    }
}>({});

export function WithDimensions(props: {
    render: (framePixels: { height: number, width: number }) => JSX.Element;
}) {
    const context = React.useContext(ReactContext);
    if(!context?.framePixels) return <React.Fragment></React.Fragment>;
    return props.render(context.framePixels);
}

export function Fill(props: {
    maxHeight?: number,
    maxWidth?: number,
    style?: React.CSSProperties,
    children: JSX.Element[]|JSX.Element|string|null
}) {
    const [ height, setHeight ] = React.useState(0);
    const [ width, setWidth ] = React.useState(0);
    const [ top, setTop ] = React.useState(0);
    const [ left, setLeft ] = React.useState(0);
    const outer = React.useRef<HTMLDivElement>(null);
    const inner = React.useRef<HTMLDivElement>(null);
    
    React.useEffect(() => {
        const ref = outer.current;
        if(ref) {
            const resizeObserver = new ResizeObserver(() => {
                if(props.maxHeight) {
                    setHeight(Math.min(props.maxHeight, ref.clientHeight));
                    setTop(props.maxHeight > ref.clientHeight ? 0 : (ref.clientHeight - props.maxHeight) / 2);
                } else {
                    setTop(0);
                    setHeight(ref.clientHeight);
                }
                if(props.maxWidth) {
                    setWidth(Math.min(props.maxWidth, ref.clientWidth));
                    setLeft(props.maxWidth > ref.clientWidth ? 0 : (ref.clientWidth - props.maxWidth) / 2);
                } else {
                    setLeft(0);
                    setWidth(ref.clientWidth);
                }
            });
            resizeObserver.observe(ref);
        }
    }, [ outer.current ]);

    return (
        <ReactContext.Provider value={{
            framePixels: {
                height, width
            }
        }}>
            <div ref={outer} className="explicit-layout-fill" style={ { 
                position: 'relative', 
                height: '100%',
                width: '100%'
            }}>
                <div ref={inner} style={ { 
                    position: 'relative', 
                    height, width, left, top,
                    ... props.style
                }}>
                    { props.children }
                </div>
            </div>
        </ReactContext.Provider>
    )
}

export function Layer(props: {
    children: JSX.Element[]|JSX.Element|string|null
}) {
    return (
        <div style={ { 
            position: 'absolute', 
            top: 0,
            left: 0,
            height: '100%',
            width: '100%'
        }} className="explicit-layout-layer" >
            { props.children }
        </div>
    )
}

export function Partition(props: {
    top: number,
    bottom: number,
    left: number,
    right: number,
    scroll?: { horizontal: boolean, vertical: boolean },
    style?: React.CSSProperties,
    children: JSX.Element[]|JSX.Element|string|null
}) {
    const context = React.useContext(ReactContext);

    if(context.framePixels) {
        const top = context.framePixels.height * props.top;
        const right = context.framePixels.width * props.right;
        const bottom = context.framePixels.height * props.bottom;
        const left = context.framePixels.width * props.left;
        return (
            <div style={ { 
                ... props.style,
                position: 'absolute', 
                top,
                bottom,
                left,
                right,
                height: bottom - top,
                width: right - left,
                overflowX: !!props.scroll?.horizontal ? 'auto' : 'hidden',
                overflowY: !!props.scroll?.vertical ? 'auto' : 'hidden'
            }} className="explicit-layout-partition" >
                <ReactContext.Provider value={{
                    framePixels: {
                        height: bottom - top, width: right - left
                    }
                }}>
                    { props.children }
                </ReactContext.Provider>
            </div>
        )    
    }
    return (
        <div style={ { 
            display: 'none'
        }}>
            Ancestor Frame not found in DOM. Partition must be a DOM descendant of Frame.
        </div>
    )
}

export const Center = {
    Both: (props: { children: JSX.Element[]|JSX.Element|string|null }) => (
        <div className="explicit-layout-center-vert" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flex: '0 0 auto', width: '100%', maxHeight: 'fit-content', alignItems: 'center' }}>
                <div className="explicit-layout-center-horiz" style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flex: '0 0 auto', maxWidth: 'fit-content', justifyContent: 'center' }}>
                        { props.children }
                    </div>
                </div>
            </div>
        </div>
    ),
    Horizontal: (props: { children: JSX.Element[]|JSX.Element|string|null }) => (
        <div className="explicit-layout-center-horiz" style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flex: '0 0 auto', maxWidth: '100%', justifyContent: 'center' }}>
                { props.children }
            </div>
        </div>
    ),
    Vertical: (props: { clip?: boolean, children: JSX.Element[]|JSX.Element|string|null }) => (
        <div className="explicit-layout-center-vert" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flex: '0 0 auto', maxWidth: 'fit-content', alignItems: 'center' }}>
                { props.children }
            </div>
        </div>
    ),
}

export const Stack = {
    East: (props: {children: JSX.Element[]|JSX.Element|string|null, gap?: number, style?: React.CSSProperties}) => 
        <div className="explicit-layout-stack-east" style={Object.assign({ position: 'relative', height: '100%', display: 'flex', gap: props.gap, flexDirection: 'row', alignContent: 'center' }, props.style)}>{props.children}</div>,
    West: (props: {children: JSX.Element[]|JSX.Element|string|null, gap?: number, style?: React.CSSProperties}) => 
        <div className="explicit-layout-stack-west" style={{ position: 'relative', height: '100%', display: 'flex', gap: props.gap, flexDirection: 'row-reverse', alignContent: 'end', ...props.style }}>{props.children}</div>,
    North: (props: {children: JSX.Element[]|JSX.Element|string|null, gap?: number, style?: React.CSSProperties}) => 
        <div className="explicit-layout-stack-north" style={{ position: 'relative', width: '100%', display: 'flex', gap: props.gap, flexDirection: 'column-reverse', justifyContent: 'end', ...props.style }}>{props.children}</div>,
    South: (props: {children: JSX.Element[]|JSX.Element|string|null, gap?: number, style?: React.CSSProperties}) => 
        <div className="explicit-layout-stack-south" style={{ position: 'relative', width: '100%', display: 'flex', gap: props.gap, flexDirection: 'column', ...props.style }}>{props.children}</div>,
    Fixed: (props: {children: JSX.Element[]|JSX.Element|string|null}) => 
        <div className="explicit-layout-stack-fixed" style={{ display: 'flex', flex: '0 0 auto' }}>{props.children}</div>,
    Stretch: (props: {children: JSX.Element[]|JSX.Element|string|null}) => 
        <div className="explicit-layout-stack-stretch" style={{ display: 'flex', flex: '1 0 auto' }}>{props.children}</div>
};

/* ReactDOM.render(
    <React.StrictMode>
      <Frame>
          <Layer>
              <Partition top={0} bottom={0.10} left={0.25} right={0.75}>
                  <Center>
                      TOP 10% CENTER 50%
                  </Center>
              </Partition>
          </Layer>
      </Frame>
    </React.StrictMode>,
    document.getElementById('root')
  );
   */