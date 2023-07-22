
const App = () => {
    return (
        <div>
            <Cartograph />
            <div id="fcontainer">
                <form id="points" action="/savepoint">
                    <div><label htmlFor="x">x</label><input id="x" name="x" type="number" min="-10000" max="10000" /></div>
                    <div><label htmlFor="y">y</label><input id="y" name="y" type="number" min="-10000" max="10000" /></div>
                    <div><label htmlFor="label">label</label><input type="text" id="label" name="label" /></div>
                    <div><label htmlFor="alone">alone</label><input type="checkbox" id="alone" name="alone" /></div>
                    <input type="submit" />
                </form>
            </div>
        </div>
    )
}