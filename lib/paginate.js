

/*
function paginateOld(total, show, page) {  
  
  var info = {
    total: Math.max(total, 0),
    show: show,
    limit: Math.max(Math.min(show, info.total), 0),
    start: 0,
    end: total,
    previous: 0,
    current: page > 0 ? page : 1,
    next: 0,
    pages: 1,
  };
  
  
  //console.log('info', info);
  
  //  Determine the number of pages
  info.pages = total / info.limit;
  info.current = Math.min(info.pages, info.current);
  info.next = info.current >= info.pages ? 0 : Math.min(info.current + 1, info.pages);
  info.previous = info.current > 1 ? info.current - 1 : info.previous;
  
  //  Determine the offsets (start/end)
  info.start = Math.max(0, (info.current * info.limit) - info.limit);
  info.end = Math.max(0, (info.current * info.limit) - 1);
  
  return info;
}
*/


function paginate(total, limit, page) {
  
  var data = {
    count: 0,
    page: parseInt(page) || 1,
    page_count: 0,
    page_previous: 0,
    page_current: 0,
    page_next: 0,
    page_first: 0,
    page_last: 0,
    offset_start: 0,
    offset_end: 0,
    offset_next: 0,
    limit: limit,
    showing: 0,
    show_start: 0,
    show_end: 0
  };
  
  
  //  Total count and limit should be at least zero;
  data.count = Math.max(0, total);  
  data.limit = Math.max(0, data.limit);
  
  if (data.limit == 0) {
    return data;
  }
  
  data.page_count = Math.ceil(data.count / data.limit);
  
  
  data.page_current = (data.page > data.page_count) ? 1 : Math.max(0, data.page);
  
  if (!data.page_current) {
    return data;
  }
  
  data.page_previous = data.page_current > 1 ? data.page_current - 1 : data.page_previous;
  data.page_next = data.page_current < data.page_count ? data.page_current + 1 : data.page_next;
  
  data.page_first = 1;
  data.page_last = data.page_count;
  
  
  data.showing = data.page_current == data.page_last ? data.count % data.limit : data.limit;
  
  //  Determine the offsets (start/end)
  data.offset_start = Math.max(0, (data.page_current * data.limit) - data.limit);
  data.offset_end = Math.max(0, (data.offset_start + data.showing - 1));
  data.offset_next = data.offset_end + 1 == data.count ? 0 : data.offset_end + 1;
  
  //  Calculate user-friendly numbers
  data.show_start = data.offset_start + 1;
  data.show_end = data.offset_end + 1;
  
  return data;
}


module.exports = paginate;


/*
var testCases = [

  //{ limit: 10, page: -1, total: 100 },
  //{ limit: -1, page: 1, total: 100 },
  //{ limit: 10, page: 1, total: 0 },

  { limit: 10, page: 1, total: 25 },
  { limit: 10, page: 3, total: 25 },
  
  //{ limit: 10, page: 1, total: 100 },
  //{ limit: 10, page: 2, total: 100 },
  //{ limit: 10, page: 3, total: 100 },
  //{ limit: 10, page: 11, total: 100 }
  
];


for (var i = 0, testCase; testCase = testCases[i]; i++) {
  
  console.log(i, paginate(testCase.total, testCase.limit, testCase.page));
  
}
//*/




