/**
 * Datatable aplication
 *
 * Created By: Anthony Diaz
 *
 * This application looks to provide a quick and easy manner of gathering an object of data and displaying it in a
 * paginated, sortable and easy to use manner.
 *
 * Requires: jQuery (Uses compatability calls for cases like wordpress)
 */
 
/**
 * All variables are prefixed with "_" to avoid same name collisions with functions
 * 
 * Development Source
 */
 

/*
 * Init the dataTable object and the default properties
 */
var dataTable =
{
    _columns: [],
    _currentPage: 1,

    _data: {},
    _displayData: {},
    _drawTarget: null,

    _lastSortedColumn: '',

    _numPages: 0,

    _rowsPerPage: 25,

    _sortDir: 'none',
    _sorted: {},
    _sortKey: '',

    _title: 'Data Table'
};

/*
 * function clearAllData()
 *
 * Return - true on completion
 *
 * Resets the storage variables for the datatable to their default state
 */
dataTable.clearAllData = function () {
    this._columns = [];
    this._currentPage = 1;

    this._data = {};
    this._displayData = {};
    this._drawTarget = null;

    this._lastSortedColumn = '';

    this._numPages = 0;

    this._rowsPerPage = 25;

    this._sortDir = 'none';
    this._sorted = {};
    this._sortKey = '';

    this._title = 'Data Table';
    
    return true;
};

/*
 * function init(data, drawTarget)
 *
 * Param data - All of the data supplied for the table
 * Param drawTarget - The ID of the target container
 *
 * Return - true on completion, false if there was an error
 *
 * Initializes the datatable, supplying data and a draw target
 */
dataTable.init = function (data, drawTarget) {
    if ((typeof(data) == 'undefined') || (typeof(drawTarget) == 'undefined')) {
        return false;
    }

    this.clearAllData();

    this._drawTarget = document.getElementById(drawTarget);

    // Store the initial dataset
    this._data = this._sorted = data._data;

    this._title = data._title || 'Datatable';

    var name = '';
    var displayable = 0;

    // Store the columns
    for (var k in data._columns) {
        name = data._columns[k];

        if (typeof(data._columnData[name]._display) == 'undefined') {
            data._columnData[name]._display = false;
        } else if (data._columnData[name]._display) {
            displayable++;
        }

        this._columns.push({
            _name: (typeof(data._columnData[name]._name) != 'undefined') ? data._columnData._name : name,
            _data: data._columnData[name]
        });
    }

    // Make sure we have at least 5 displayable columns to start
    var counter = 0;
    while (displayable < 5) {
        // Break out, we have nothing to display
        if (typeof(this._columns[counter]) == 'undefined') {
            break;
        }

        if (this._columns[counter]._data._display == false) {
            this._columns[counter]._data._display = true;
            displayable++;
        }

        counter++;
    }

    this._numPages = Math.ceil(this._sorted.length / this._rowsPerPage);

    this.redraw();
    
    return true;
};

/*
 * function redraw()
 *
 * Param page - The page number to seek to.  This can draw non-existant pages if called manually
 *
 * Return - true on completion
 *
 * Draws the datatable and the provided page into the draw target
 */
dataTable.redraw = function (page) {
    if ((typeof(page) == 'undefined') || (typeof(page) != 'number')) {
        page = 1;
    }

    var dataTableContainer = document.createElement('div');
    dataTableContainer.className = 'dataTable-container';

    var dataTableCon = document.createElement('div');
    dataTableCon.className = 'datatable-overflow-container';

    var dataTable = document.createElement('div');
    dataTable.className = 'dataTable-table';

    dataTable.appendChild(this.constructHeader());
    dataTable.appendChild(this.constructPage((page - 1) * this._rowsPerPage, page * this._rowsPerPage));

    if (jQuery(dataTable).children('.dataTable-hide').length > 0) {
        dataTable.innerHTML = '';
    }

    dataTableCon.appendChild(dataTable);

    dataTableContainer.appendChild(this.constructControlHeader());
    dataTableContainer.appendChild(dataTableCon);
    dataTableContainer.appendChild(this.constructFooter());

    this._drawTarget.innerHTML = '';
    this._drawTarget.appendChild(dataTableContainer);
    
    return true;
};

/*
 * function constructControlHeader()
 *
 * Return - The control header container and contents completely constructed
 *
 * Constructs the control header
 */
dataTable.constructControlHeader = function () {
    var c = document.createElement('div');
    var col = document.createElement('ul');
    var ul = document.createElement('ul');
    ul.className = 'dataTable-control-title';
    ul.innerHTML = this._title;
    col.className = 'dataTable-togglecolumn-con';
    c.className = 'dataTable-control-container';
    var e;
    var con;

    // Construct the column select list
    for (var k in this._columns) {
        con = document.createElement('ul');
        con.className = 'datatable-togglecolumn-container datatable-unselectable';
        con.id = 'datatable-togglecolumn-container-'+this._columns[k]._name;
        e = document.createElement('input');
        e.setAttribute('type', 'checkbox');
        e.id = 'dataTable-togglecolumn-' + this._columns[k]._name;
        e.className = 'dataTable-togglecolumn-checkbox';
        e.onclick = (function (obj, k) {
            return function () {
                obj.toggleColumn(obj._columns[k]._name)
            }
        })(this, k);
        e.checked = this._columns[k]._data._display;

        con.appendChild(e);

        // Now create the label for the input
        e = document.createElement('label');
        e.className = 'dataTable-togglecolumn-label datatable-unselectable';
        e.innerHTML = this._columns[k]._name;
        e.setAttribute('for', 'dataTable-togglecolumn-' + this._columns[k]._name);
        con.appendChild(e);

        col.appendChild(con);
    }

    c.appendChild(ul);
    c.appendChild(col);

    return c;
};

/*
 * function constructHeader()
 *
 * Param returnOnlyContents - boolean value of eather to return only the contents of the conatiner or not
 *                            Contents should be returned if the container was already drawn before
 *
 * Return - The datatable header container or contents depending on returnOnlyContents
 *
 * Constructs the datatable header
 */
dataTable.constructHeader = function (returnOnlyContents) {
    var c = document.createElement('ul');
    c.className = 'dataTable-header-row';

    var e = null;
    var display = false;

    for (var key in this._columns) {
        if (this._columns[key]._data._display == false) {
            continue;
        }

        display = true;

        // Construct the header row
        e = document.createElement('li');
        e.className = 'dataTable-header-column unselectable dataTable-hoverable';
        e.innerHTML = this._columns[key]._name;
        e.id = 'header_' + this._columns[key]._name;

        if ((typeof(this._columns[key]._data._sortable) != 'undefined') &&
            (this._columns[key]._data._sortable == true)) {
            // Add in sortable trigger on click
            e.onclick = (function (obj, k, i) {
                return function () {
                    obj.sortColumn(k, i)
                }
            })(this, this._columns[key]['_name'], 'header_' + this._columns[key]['_name']);
            e.className = e.className + ' dataTable-sortable';

            // During redraw we can have a column already sorted.  Pick this up and append the correct class
            if (this._columns[key]._name == this._sortKey) {
                e.className = e.className + ' dataTable-sorted-' + this._sortDir;
            }
        }

        c.appendChild(e);
    }

    if (!display) {
        c.className = c.className + ' dataTable-hide';
    }

    if ((typeof(returnOnlyContents) != 'undefined') && returnOnlyContents) {
        return c.innerHTML;
    } else {
        return c;
    }
};


/*
 * function constructPage()
 *
 * Param min - int The starting row to draw
 * Param max - int The ending row to draw
 * Param returnOnlyContents - boolean value of eather to return only the contents of the conatiner or not
 *                            Contents should be returned if the container was already drawn before
 *
 * Return - The datatable body container or contents depending on returnOnlyContents
 *
 * Constructs the datatable body (actual data)
 */
dataTable.constructPage = function (min, max, returnOnlyContents) {
    var con = document.createElement('ul');
    con.className = 'dataTable-body';
    con.id = 'dataTable-body';
    var r;
    var col;

    for (var i = min; i < max; i++) {
        r = document.createElement('ul');
        r.className = 'dataTable-body-row';
        r.id = 'dataTable-body-row-' + i;

        if (typeof(this._sorted[i]) == 'undefined') {
            break;
        }

        // Build the data now
        for (var k in this._columns) {
            if (this._columns[k]._data._display == false) {
                continue;
            }

            col = document.createElement('li');
            col.className = 'dataTable-body-column';
            col.id = 'dataTable-body-row-' + i + '-column-' + this._columns[k]._name;
            col.innerHTML = this._sorted[i][this._columns[k]._name]._content;

            // Append extra attributes
            if (typeof(this._sorted[i][this._columns[k]._name]._onClick) != 'undefined') {
                col.setAttribute('onClick', this._sorted[i][this._columns[k]._name]._onClick);
                col.className = col.className + ' dataTable-clickable';
            }
            
            if (typeof(this._sorted[i][this._columns[k]._name]._classes) != 'undefined')
            {
                for (var j in this._sorted[i][this._columns[k]._name]._classes)
                {
                    col.className = col.className + ' ' + this._sorted[i][this._columns[k]._name]._classes[j];
                }
            }

            r.appendChild(col);
        }

        con.appendChild(r);
    }

    if ((typeof(returnOnlyContents) != 'undefined') && returnOnlyContents) {
        return con.innerHTML;
    } else {
        return con;
    }
};

/*
 * function constructFooter()
 *
 * Param returnOnlyContents - boolean value of eather to return only the contents of the conatiner or not
 *                            Contents should be returned if the container was already drawn before
 *
 * Return - The datatable footer container or contents depending on returnOnlyContents
 *
 * Constructs the datatable footer
 */
dataTable.constructFooter = function (returnOnlyContents) {
    var c = document.createElement('div');
    c.className = 'dataTable-footer-row';
    var e;
    var o;
    var li;

    e = document.createElement('ul');
    e.className = 'dataTable-footer-rows-container';

    li = document.createElement('li');
    li.innerHTML = 'Rows per page:';

    e.appendChild(li);

    sel = document.createElement('select');
    sel.id = 'datatable-footer-rows-input';
    sel.onclick = (function (obj) {
        return function () {
            obj.doUpdateRowsPerPage()
        }
    })(this);
    sel.onkeyup = (function (obj) {
        return function () {
            obj.doUpdateRowsPerPage()
        }
    })(this);
    o = document.createElement('option');
    o.innerHTML = '25';
    o.value = '25';
    sel.appendChild(o);
    o = document.createElement('option');
    o.innerHTML = '50';
    o.value = '50';
    sel.appendChild(o);
    o = document.createElement('option');
    o.innerHTML = '100';
    o.value = '100';
    sel.appendChild(o);
    sel.value = this._rowsPerPage.toString();
    e.appendChild(sel);
    c.appendChild(e);

    e = document.createElement('ul');
    e.className = 'dataTable-footer-page-container';


    li = document.createElement('li');
    li.innerHTML = 'Page:';
    e.appendChild(li);

    var sel = document.createElement('input');
    sel.id = 'datatable-footer-page-input';
    sel.setAttribute('type', 'number');
    sel.setAttribute('min', '1');
    sel.setAttribute('max', this._numPages);
    sel.title = 'This can be typed into or, on browsers that support it, feel free to use the arrows';
    sel.value = this._currentPage;
    sel.onclick = (function (obj) {
        return function () {
            obj.doChangePage()
        }
    })(this);

    sel.onkeyup = (function (obj) {
        return function () {
            obj.doChangePage()
        }
    })(this);

    e.appendChild(sel);

    li = document.createElement('li');
    li.innerHTML = 'of ' + this._numPages;
    e.appendChild(li);

    c.appendChild(e);

    if ((typeof(returnOnlyContents) != 'undefined') && returnOnlyContents) {
        return c.innerHTML;
    } else {
        return c;
    }
};

/*
 * function sortColumn()
 *
 * Param column - string The column to sort on
 * Param columnID - string The ID of the column to apply the new classes to
 * Param reset - bool reset all sorting on all columns
 *
 * Return - true on success of false on failure
 *
 * Sorts the specified column.  Changes sorting based on how the column was already sorted
 */
dataTable.sortColumn = function (column, columnID, reset) {
    var e = document.getElementById(columnID);
    var b = document.getElementById('dataTable-body');

    reset = reset || false;

    if (e == null) {
        return false;
    }

    // Check to be sure that the element name is not the same as the old one, otherwise, remove the class for sorting
    if ((this._lastSortedColumn != '') && (columnID != this._lastSortedColumn)) {
        // Reset the last sorted column now
        var t = document.getElementById(this._lastSortedColumn);
        t.className = t.className.replace(/ dataTable-sorted-[\w]+/, '');
    }

    if (reset == true) {
        t.className = t.className.replace(/ dataTable-sorted-[\w]+/, '');
        
        this._sorted = this._data;
        
        b.innerHTML = this.constructPage(this._rowsPerPage * (this._currentPage - 1), this._rowsPerPage * this._currentPage, true);

        return true;
    }

    this._lastSortedColumn = columnID;
    this._sortKey = column;

    if (~e.className.indexOf('dataTable-sorted-desc')) {
        e.className = e.className.replace('dataTable-sorted-desc', 'dataTable-sorted-asc');

        this.doSort(column, 'asc');
        this._sortDir = 'asc';

        b.innerHTML = this.constructPage(this._rowsPerPage * (this._currentPage - 1), this._rowsPerPage * this._currentPage, true);

        return true;
    } else {
        if (~e.className.indexOf('dataTable-sorted-')) {
            e.className = e.className.replace('dataTable-sorted-asc', 'dataTable-sorted-desc');

            this.doSort(column, 'desc');
            this._sortDir = 'desc';

            b.innerHTML = this.constructPage(this._rowsPerPage * (this._currentPage - 1), this._rowsPerPage * this._currentPage, true);

            return true;
        } else {
            e.className = e.className + ' dataTable-sorted-asc';

            this.doSort(column, 'asc');
            this._sortDir = 'asc';

            b.innerHTML = this.constructPage(this._rowsPerPage * (this._currentPage - 1), this._rowsPerPage * this._currentPage, true);

            return true;
        }
    }
    
    return false;
};

/*
 * function doSort()
 *
 * Param column - string The column to sort on
 * Param direction - string Direction to sort, accepts "asc" and "desc"
 *
 * Return - true on success of false on failure
 *
 * Sorts the specified column.  based on the columns settings and direction
 */
dataTable.doSort = function (column, direction) {
    var clone = [];
    
    // get the column key
    for (var k in this._columns)
    {
        if (this._columns[k]._name == column)
        {
            break;
        }
    }
    
    for (var i in this._data) {
        clone.push([i, (this._data[i][column]._content !== null) ? this._data[i][column]._content : '']);
    }

    if (typeof(this._columns[k]._data._sortType != 'undefined') && (this._columns[k]._data._sortType == 'number'))
    {
        clone.sort(this.sortByNumber)
    } else {
        clone.sort(this.sort);
    }
    
    if ((typeof(direction) != 'undefined') && (direction == 'desc')) {
        clone.reverse();
    }

    // Now store the data
    var store = [];

    for (var i in clone) {
        store.push(this._data[clone[i][0]]);
    }

    this._sorted = store;
    
    return true;
};

/*
 * function sort()
 *
 * Param a - mixed Base value for the sort matching
 * Param b - mixed New value for the sort matching
 *
 * Return - int sort priority.  
 *          1 if the value is sorted higher than the current
 *          0 if the value is sorted the same as the current
 *          -1 if the value is sorted lower then the current
 *
 * Performs a naturalized sort on the 2 values
 */
dataTable.sort = function (a, b) {
    var reA = /[^a-zA-Z.\\\/]/g;
    var reN = /[^0-9]/g;
    
    var AInt = parseInt(a[1], 10);
    var BInt = parseInt(b[1], 10);

    if(isNaN(AInt) && isNaN(BInt)){
        var aA = a[1].replace(reA, "").toLowerCase();
        var bA = b[1].replace(reA, "").toLowerCase();
        if(aA === bA) {
            var aN = parseInt(a[1].replace(reN, ""), 10);
            var bN = parseInt(b[1].replace(reN, ""), 10);
            return aN === bN ? 0 : aN > bN ? 1 : -1;
        } else {
            return aA > bA ? 1 : -1;
        }
    }else if(isNaN(AInt)){//A is not an Int
        return 1;//to make alphanumeric sort first return -1 here
    }else if(isNaN(BInt)){//B is not an Int
        return -1;//to make alphanumeric sort first return 1 here
    }else{
        return AInt > BInt ? 1 : -1;
    }
};

/*
 * function sortByNumber()
 *
 * Param a - mixed Base value for the sort matching
 * Param b - mixed New value for the sort matching
 *
 * Return - int sort priority.  
 *          1 if the value is sorted higher than the current
 *          0 if the value is sorted the same as the current
 *          -1 if the value is sorted lower then the current
 *
 * Performs a number specific sort on the 2 values
 */
dataTable.sortByNumber = function(a, b) {
    var a1 = Number(a[1].replace(',', ''));
    var b1 = Number(b[1].replace(',', ''));
    
    if (a1 < b1) return -1;
    if (a1 > b1) return 1;
    return 0;
};

/*
 * function changePage()
 *
 * Param page - int New page to change to
 *
 * Return - bool True on success or false on failure
 *
 * Draws the page specified, failing if the page does not exist
 * This function only redraws the table body, the bare minimum to change page
 */
dataTable.changePage = function (page) {
    if ((page > 0) && (page <= this._numPages)) {
        // Change the page then
        var b = document.getElementById('dataTable-body');
        this._currentPage = page;

        b.innerHTML = this.constructPage(this._rowsPerPage * (this._currentPage - 1), this._rowsPerPage * this._currentPage, true);
        return true;
    }

    return false;
};

/*
 * function doChangePage()
 *
 * Return - bool True on success or false on failure
 *
 * Runs the change page autonomous function.  This changes the page based on the value of the page input container
 */
dataTable.doChangePage = function () {
    var page = document.getElementById('datatable-footer-page-input').value;

    if ((page.search(/[a-zA-z]/) == -1) && (page != this._currentPage)) {
        return this.changePage(page);
    }
    
    return false;
};

/*
 * function doUpdateRowsPerPage()
 *
 * Return - bool True on success or false on failure
 *
 * Runs the change rows per page autonomous task.  This checks the value of the rows per page input for its value
 */
dataTable.doUpdateRowsPerPage = function () {
    var rows = document.getElementById('datatable-footer-rows-input').value;

    if ((rows.search(/[a-zA-z]/) == -1) && (rows != this._rowsPerPage)) {
        this._rowsPerPage = rows;

        // Recalculate pages as well
        this._currentPage = 1;
        this._numPages = Math.ceil(this._sorted.length / this._rowsPerPage);

        this.redraw(this._currentPage);
        
        return true;
    }
    
    return false;
};

/*
 * function doUpdateCurrentData()
 *
 * Param data - New data to initialize into the datatable.
 *
 * Return - bool True on success or false on failure
 *
 * This function is used to intruduce new data or change data into the datatable.
 * THIS FUNCTION DOES NOT CHANGE THE COLUMNS
 */
dataTable.doUpdateCurrentData = function(data)
{
    if (typeof(data) != 'undefined')
    {
        // We have data, start.  This needs to repeat init(), but with  more flexibility and needs to preserve settings
        this._data = data;
    
        // Apply sorting if we need to and redraw all elements
        if (this._sortKey != '')
        {
            if (this._sortDir == 'desc')
            {
                this.doSort(this._sortKey, 'desc');
            } else {
                this.doSort(this._sortKey, 'asc');
            }
        } else {
            this._sorted = this._data;
        }
    
        this._numPages = Math.ceil(this._sorted.length / this._rowsPerPage);
        
        // If we are not on the first page, try to account for the fact we can loose a page
        if ((this._currentPage != 1) && (this._currentPage < 0))
        {
            this._currentPage = (this._currentPage <= this._numPages) ? this._currentPage : this._numPages;
        } else {
            // Account for the fact a user could have an invalid page number at this point
            this._currentPage = 1;
        }
        
        // Lastly, redraw
        this.redraw(this._currentPage);
        
        return true;
    }
    
    return false;
};

/*
 * function toggleColumn()
 *
 * Param column - The name of the column to toggle
 *
 * Return - bool True on success or false on failure
 *
 * Toggles the specified column into or out of visibility
 */
dataTable.toggleColumn = function (column) {
    if (typeof(column) != 'undefined') {
        for (var k in this._columns) {
            if (this._columns[k]._name == column) {
                this._columns[k]._data._display = !(this._columns[k]._data._display);
            }
        }

        var dataTable = jQuery('.dataTable-table');
        dataTable.html('');

        dataTable.append(this.constructHeader());
        dataTable.append(this.constructPage(this._rowsPerPage * (this._currentPage - 1), this._rowsPerPage * this._currentPage));
        
        return true;
    }
    
    return false;
};
