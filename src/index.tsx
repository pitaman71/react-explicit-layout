import React from 'react';
import ReactDOM from 'react-dom';
//import './index.css';

const ReactContext = React.createContext<{
    framePixels?: {
        height: number,
        width: number
    }
}>({});

export function Fill(props: {
    maxHeight?: number,
    maxWidth?: number,
    children: JSX.Element[]|JSX.Element|string|null
}) {
    const [ height, setHeight ] = React.useState(0);
    const [ width, setWidth ] = React.useState(0);
    const [ top, setTop ] = React.useState(0);
    const [ left, setLeft ] = React.useState(0);
    const outer = React.useRef<HTMLDivElement>(null);
    const inner = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if(outer.current) {
            if(props.maxHeight) {
                setHeight(Math.min(props.maxHeight, outer.current.clientHeight));
                setTop(props.maxHeight > outer.current.clientHeight ? 0 : (outer.current.clientHeight - props.maxHeight) / 2);
            } else {
                setTop(0);
                setHeight(outer.current.clientHeight);
            }
            if(props.maxWidth) {
                setWidth(Math.min(props.maxWidth, outer.current.clientWidth));
                setLeft(props.maxWidth > outer.current.clientWidth ? 0 : (outer.current.clientWidth - props.maxWidth) / 2);
            } else {
                setLeft(0);
                setWidth(outer.current.clientWidth);
            }
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
                    height, width, left, top
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
                position: 'absolute', 
                top,
                bottom,
                left,
                right,
                height: bottom - top,
                width: right - left
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
            <div style={{ display: 'flex', flex: '0 0 auto', width: '100%', maxHeight: 'fit-content' }}>
                <div className="explicit-layout-center-horiz" style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flex: '0 0 auto', maxWidth: 'fit-content' }}>
                        { props.children }
                    </div>
                </div>
            </div>
        </div>
    ),
    Horizontal: (props: { children: JSX.Element[]|JSX.Element|string|null }) => (
        <div className="explicit-layout-center-horiz" style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flex: '0 0 auto', maxWidth: '100%' }}>
                { props.children }
            </div>
        </div>
    ),
    Vertical: (props: { clip?: boolean, children: JSX.Element[]|JSX.Element|string|null }) => (
        <div className="explicit-layout-center-vert" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flex: '0 0 auto', maxWidth: 'fit-content' }}>
                { props.children }
            </div>
        </div>
    ),
}

export const Stack = {
    North: (props: {children: JSX.Element[]|JSX.Element|string|null, gap?: number}) => 
        <div className="explicit-layout-stack-north" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', gap: props.gap, flexDirection: 'row', alignContent: 'center' }}>{props.children}</div>,
    South: (props: {children: JSX.Element[]|JSX.Element|string|null, gap?: number}) => 
        <div className="explicit-layout-stack-south" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', gap: props.gap, flexDirection: 'row-reverse', alignContent: 'center' }}>{props.children}</div>,
    East: (props: {children: JSX.Element[]|JSX.Element|string|null, gap?: number}) => 
        <div className="explicit-layout-stack-east" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', gap: props.gap, flexDirection: 'column-reverse', justifyContent: 'center' }}>{props.children}</div>,
    West: (props: {children: JSX.Element[]|JSX.Element|string|null, gap?: number}) => 
        <div className="explicit-layout-stack-west" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', gap: props.gap, flexDirection: 'column', justifyContent: 'center' }}>{props.children}</div>,
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