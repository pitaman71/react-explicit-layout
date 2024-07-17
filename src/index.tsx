import React from 'react';

type DivRef = React.RefObject<HTMLDivElement>;

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

export function Fill(props: React.PropsWithChildren<{
    maxHeight?: number,
    maxWidth?: number,
    style?: React.CSSProperties
}>) {
    const [ height, setHeight ] = React.useState(0);
    const [ width, setWidth ] = React.useState(0);
    const [ top, setTop ] = React.useState(0);
    const [ left, setLeft ] = React.useState(0);
    const outer = React.useRef<HTMLDivElement>(null);
    const inner = React.useRef<HTMLDivElement>(null);
    
    React.useEffect(() => {
        const ref = outer.current;
        if(ref) {
            const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
                if (!Array.isArray(entries) || !entries.length) {
                    return;
                }
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
            return () => {
                resizeObserver.disconnect();
            };
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

export function Layer(props: React.PropsWithChildren<{}>) {
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

export function Partition(props: React.PropsWithChildren<{
    top: number,
    bottom: number,
    left: number,
    right: number,
    scroll?: { horizontal: boolean, vertical: boolean },
    style?: React.CSSProperties
}>) {
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
    Both: (props: React.PropsWithChildren<{ id?: string, divRef?: DivRef, style?: React.CSSProperties }>) => (
        <div id={props.id} ref={props.divRef} className="explicit-layout-center-both" style={{ position: 'relative', height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textWrap: 'balance', ...props.style }}>
            { props.children }
        </div>
    ),
    Horizontal: (props: React.PropsWithChildren<{ id?: string, divRef?: DivRef, style?: React.CSSProperties }>) => (
        <div id={props.id} ref={props.divRef} className="explicit-layout-center-horiz" style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', textWrap: 'balance', ...props.style }}>
            { props.children }
        </div>
    ),
    Vertical: (props: React.PropsWithChildren<{ id?: string, divRef?: DivRef, clip?: boolean, style?: React.CSSProperties }>) => (
        <div id={props.id} ref={props.divRef} className="explicit-layout-center-vert" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', ...props.style }}>
            { props.children }
        </div>
    ),
}

function _makeGridTemplate(count?: number) {
    if(count === undefined) return undefined;
    let result = '';
    for(let index = 0; index < count;++index) {
        if(result !== '')
            result += ' ';
        result += '1fr';
    }
    return result;
}

function Scrollable(props: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & {
    divRef?: DivRef
}>) {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(()=> {
        if(props.id && window.history.state?.scroll && window.history.state?.scroll[props.id]) {
            const ref = props.divRef?.current || scrollRef.current;
            const pos = window.history.state?.scroll[props.id];
            if(ref && ref.scrollHeight > pos) {
                ref.scrollTop = pos;
                window.history.replaceState({
                    ...window.history.state,
                    scroll: {
                        ... window.history.state.scroll,
                        [props.id]: undefined
                    }
                }, '');
            }
        }
    }, [ props.children, props.divRef?.current?.scrollHeight, scrollRef.current?.scrollHeight ])
    return <div {...props} ref={props.divRef || scrollRef} onScroll={event => {
        if(props.id) window.history.replaceState({
            ...window.history.state,
            scroll: {
                ... window.history.state.scroll,
                [props.id]: (event.target as HTMLElement).scrollTop
            }
        }, '');
    }} style={{
        position: 'relative',
        ...props.style
    }}>{props.children}</div>
}

export const Grid = {
    Vertical: (props: React.PropsWithChildren<{id?: string, divRef?: DivRef, shape: { rows?: number, columns?: number }, scroll?: boolean, style?: React.CSSProperties}>) => {
        return <Scrollable id={props.id} divRef={props.divRef} className="explicit-layout-grid-vert" style={{ 
            width: '100%', 
            height: '100%',
            display: props.shape.rows || props.shape.columns ? 'grid' : 'inline-block',
            gridAutoFlow: props.shape.rows || props.shape.columns ? 'column' : undefined,
            gridTemplateRows: _makeGridTemplate(props.shape.rows),
            gridTemplateColumns: _makeGridTemplate(props.shape.columns),
            overflowX: 'hidden',
            overflowY: props.scroll === true ? 'auto' : 'hidden',
            ...props.style 
        }}>{props.children}</Scrollable>
    },
    Horizontal: (props: React.PropsWithChildren<{id?: string, divRef?: DivRef, shape: { rows?: number, columns?: number }, scroll?: boolean, style?: React.CSSProperties}>) => {
        return <Scrollable id={props.id} divRef={props.divRef} className="explicit-layout-grid-horiz" style={{ 
            width: '100%', 
            height: '100%',
            display: props.shape.rows || props.shape.columns ? 'grid' : 'inline-block',
            gridAutoFlow: props.shape.rows || props.shape.columns ? 'row' : undefined,
            gridTemplateRows: _makeGridTemplate(props.shape.rows),
            gridTemplateColumns: _makeGridTemplate(props.shape.columns),
            overflowX: props.scroll === true ? 'auto' : 'hidden',
            overflowY: 'hidden',
            ...props.style 
        }}>{props.children}</Scrollable>
    }
};
    
export const Stack = {
    East: (props: React.PropsWithChildren<{id?: string, divRef?: DivRef, gap?: number, fill?: boolean, scroll?: boolean, style?: React.CSSProperties}>) => 
        <Scrollable id={props.id} divRef={props.divRef} className="explicit-layout-stack-east" style={{ 
            maxHeight: '100%',
            maxWidth: '100%', 
            display: 'flex', 
            flex: !props.fill ? "0 0 auto" : "1", 
            overflowX: props.scroll ? 'auto' : undefined , 
            gap: props.gap, 
            flexDirection: 'row', 
            alignContent: 'center', 
            ...props.style 
        }}>{props.children}</Scrollable>,
    West: (props: React.PropsWithChildren<{id?: string, divRef?: DivRef, gap?: number, fill?: boolean, scroll?: boolean, style?: React.CSSProperties}>) => 
        <Scrollable id={props.id} divRef={props.divRef}className="explicit-layout-stack-west" style={{ 
            maxHeight: '100%',
            maxWidth: '100%', 
            position: 'relative', 
            display: 'flex', 
            flex: !props.fill ? "0 0 auto" : "1", 
            overflowX: props.scroll ? 'auto' : undefined, 
            gap: props.gap, 
            flexDirection: 'row-reverse', 
            alignContent: 'end', 
            ...props.style 
        }}>{props.children}</Scrollable>,
    North: (props: React.PropsWithChildren<{id?: string, divRef?: DivRef, gap?: number, fill?: boolean, scroll?: boolean, style?: React.CSSProperties}>) => 
        <Scrollable id={props.id} divRef={props.divRef} className="explicit-layout-stack-north" style={{ 
            maxHeight: '100%',
            maxWidth: '100%', 
            position: 'relative', 
            display: 'flex', 
            flex: !props.fill ? "0 0 auto" : "1", 
            overflowY: props.scroll ? 'auto' : undefined, 
            gap: props.gap, 
            flexDirection: 'column-reverse', 
            justifyContent: 'end', 
            ...props.style 
        }}>{props.children}</Scrollable>,
    South: (props: React.PropsWithChildren<{id?: string, divRef?: DivRef, gap?: number, fill?: boolean, scroll?: boolean, style?: React.CSSProperties}>) => 
        <Scrollable id={props.id} divRef={props.divRef} className="explicit-layout-stack-south" style={{ 
            maxHeight: '100%',
            maxWidth: '100%', 
            position: 'relative', 
            display: 'flex', 
            flex: !props.fill ? "0 0 auto" : "1", 
            overflowY: props.scroll ? 'auto' : undefined, 
            gap: props.gap, 
            flexDirection: 'column', 
            ...props.style 
    }}>{props.children}</Scrollable>,
    Fixed: (props: React.PropsWithChildren<{id?: string, divRef?: DivRef }>) => 
        <div id={props.id} ref={props.divRef} className="explicit-layout-stack-fixed" style={{ display: 'flex', flex: '1 1 auto' }}>{props.children}</div>,
    Stretch: (props: React.PropsWithChildren<{id?: string, divRef?: DivRef }>) => 
        <div id={props.id} ref={props.divRef} className="explicit-layout-stack-stretch" style={{ display: 'flex', flex: '1 0 auto' }}>{props.children}</div>
};
