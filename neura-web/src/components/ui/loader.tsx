function Loader({screen = false}: {screen?: boolean }) {
    return ( 
        <div className={`loader-container flex justify-center items-center ${screen ? 'fixed z-100 bg-background inset-0 ' : ''}`}>
            <span className="loader"></span>
        </div>
     );
}

export default Loader;