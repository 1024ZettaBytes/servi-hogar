import { useEffect, useRef } from 'react'
export default function Banner(): JSX.Element {
    const banner = useRef<HTMLDivElement>()

    const atOptions = {
        'key' : '9314d566a205949ab8c2c6c197125c11',
		'format' : 'iframe',
		'height' : 600,
		'width' : 160,
		'params' : {}
    }
    useEffect(() => {
    if (banner.current && !banner.current.firstChild) {
        const conf = document.createElement('script')
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = `//www.highperformancedformats.com/${atOptions.key}/invoke.js`
        conf.innerHTML = `atOptions = ${JSON.stringify(atOptions)}`

        banner.current.append(conf)
        banner.current.append(script)
    }
}, [banner])

    return <div className="mx-2 my-5 border border-gray-200 justify-center items-center text-white text-center" style={{visibility: 'hidden'}} ref={banner}></div>
}