import React from 'react';
import ReactDOM from 'react-dom';
//import './index.css';

const ReactContext = React.createContext<{
    framePixels?: {
        height: number,
        width: number
    }
}>({});

export function Frame(props: {
    children: JSX.Element[]|JSX.Element|string|null
}) {
    const [ height, setHeight ] = React.useState(0);
    const [ width, setWidth ] = React.useState(0);
    const mainDiv = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        let subscription;
        if(mainDiv.current) {
            setHeight(mainDiv.current.clientHeight);
            setWidth(mainDiv.current.clientWidth);
        }
    }, [ mainDiv.current ]);

    return (
        <ReactContext.Provider value={{
            framePixels: {
                height, width
            }
        }}>
            <div ref={mainDiv} style={ { 
                position: 'relative', 
                height: '100%',
                width: '100%'
            }}>
                { props.children }
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
        }}>
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
            }}>
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

export function Center(props: {
    children: JSX.Element[]|JSX.Element|string|null
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', 'justifyContent': 'center', width: '100%', height: '100%' }}>
            <div style={{ display: 'flex', flex: '0 0 auto' }}>
                { props.children }
            </div>
        </div>
    )
}

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