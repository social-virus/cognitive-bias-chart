const link_prefix = "https://en.wikipedia.org/wiki/";

var tree_colors = [
  "#098",// cyan  (originally #7DB5BA)
  "#07A",// blue  (originally #93B6D8)
  "#490",// green (originally #A4D16E)
  "#993366",
];
var tree_radii = [142,284,428];

var title_text_size = 32;
var category_text_size = 32;
var subcategory_text_size = 15;
var entry_text_size = 11;

var title_y = -720;
var category_x = 770;
var category_y = 580;

var sub_category_spacing = 1.0;
var category_spacing = 0.0;

var small_dot_radius = 3.0;
var big_dot_radius = 10.0;

var circumcircle_radius = 630.0;
var circumcircle_color = "#CCCCCC";



var polar_to_cartesian = function(radius, angle, full_angle){
  var angle_in_radians = angle * 2*Math.PI / full_angle;
  var x = radius * Math.sin(angle_in_radians);
  var y =-radius * Math.cos(angle_in_radians);
  return {x:x,y:y};
};

var lerp = function(a, b, t){
  return (1.0-t)*a + t*b;
};

var push_radial_path = function(string_array, inner_radius, inner_angle, outer_radius, outer_angle, full_angle){
  var inner_position = polar_to_cartesian(inner_radius, inner_angle, full_angle);
  var outer_position = polar_to_cartesian(outer_radius, outer_angle, full_angle);
  
  var curviness = 0.5; // 0 => straight line, 1.0 => 90 degree turns
  var inner_control_radius = lerp(inner_radius, outer_radius, curviness);
  var outer_control_radius = lerp(outer_radius, inner_radius, curviness);
  
  var inner_control = polar_to_cartesian(inner_control_radius, inner_angle, full_angle);
  var outer_control = polar_to_cartesian(outer_control_radius, outer_angle, full_angle);
  
  string_array.push('<path d="M',
    inner_position.x,' ',inner_position.y,' C ',
    inner_control.x ,' ',inner_control.y ,', ',
    outer_control.x ,' ',outer_control.y ,', ',
    outer_position.x,' ',outer_position.y,'"/>\n');
};

const push_circle = function(string_array, position, radius){
    string_array.push('<circle cx="',position.x,'" cy="',position.y,'" r="',radius,'"/>\n');
};

const push_text = function(string_array, input_string, text_size, attributes, alignment = 0.5)
{
  var lines = input_string.split('\n');
  var num_lines = lines.length;
  if(!(num_lines > 0)) return;
  var line_height = text_size * 1.5;
  
  string_array.push('<text ');
  string_array.push.apply(string_array, attributes); // Push an array of elements
  string_array.push('>');
  
  var total_height = line_height*(num_lines-1) + text_size;
  var lowest_position = text_size;
  var hightest_position = text_size-total_height;
  var y = lerp(lowest_position, hightest_position, alignment);
  string_array.push('<tspan x="0" y="',y,'">',lines[0],'</tspan>');
  
  for(var i = 1; i < num_lines; ++i){
    string_array.push('<tspan x="0" dy="',line_height,'">',lines[i],'</tspan>');
  }
  
  string_array.push('</text>\n');
};

var generate = function() {
  // Figure out the positioning of the entries
  var angle_offset = 0.5 * (1 + category_spacing + sub_category_spacing);
  var accumulator = angle_offset;
  var num_sub_categories = 0;
  var num_entries = 0;
  
  var categories = tree_text.children || [];
  var num_categories = categories.length;

  for(var i = 0; i < num_categories; ++i) {
    var category = categories[i];
    
    var sub_categories = category.children || [];
    num_sub_categories += sub_categories.length;

    for(var k = 0; k < sub_categories.length; ++k) {
      var sub_category = sub_categories[k];
      
      var entries = sub_category.children || [];
      num_entries += entries.length;

      for(var m = 0; m < entries.length; ++m) {
        entries[m].angle = accumulator;
        accumulator += 1;
      }
      accumulator += sub_category_spacing;
      
      var first_angle = entries[0].angle;
      var last_angle = entries[entries.length-1].angle;
      sub_category.angle = (first_angle + last_angle) * 0.5;
    }
    accumulator += category_spacing;
    
    var first_angle = sub_categories[0].angle;
    var last_angle = sub_categories[sub_categories.length-1].angle;
    category.angle = (first_angle + last_angle) * 0.5;
  }
  var full_angle = accumulator - angle_offset;
  
  // 'Draw' everything
  var result = []; // Array of strings and numbers to be merged into the SVG's content.
  var text_flipping_attributes = 'text-anchor="end" transform="rotate(180 12,0)"';
  
  // Draw the outer circle
  result.push('<circle r="',circumcircle_radius,'" style="stroke:',circumcircle_color,';" fill="none"/>\n');
  
  // Draw the title
  result.push('<text style="font-size:', title_text_size, 'px; font-weight:bold; text-anchor:middle;" y="', title_y,'">',tree_text.name, '</text>');

  // Draw the categories
  result.push('<g style="font-size:',category_text_size,'px;">\n');
  {
    var attributes_0 = ['style="text-anchor:middle; font-weight:bold; fill:',tree_colors[0],'" transform="translate(', category_x,',',-category_y,')"'];
    var attributes_1 = ['style="text-anchor:middle; font-weight:bold; fill:',tree_colors[1],'" transform="translate(', category_x,',', category_y,')"'];
    var attributes_2 = ['style="text-anchor:middle; font-weight:bold; fill:',tree_colors[2],'" transform="translate(',-category_x,',', category_y,')"'];
    var attributes_3 = ['style="text-anchor:middle; font-weight:bold; fill:',tree_colors[3],'" transform="translate(',-category_x,',',-category_y,')"'];
    push_text(result, categories[0].name, category_text_size, attributes_0);
    push_text(result, categories[1].name, category_text_size, attributes_1);
    push_text(result, categories[2].name, category_text_size, attributes_2);
    push_text(result, categories[3].name, category_text_size, attributes_3);
  }
  result.push('</g>');
  
  // Draw everything else
  result.push('<g style="font-size:',entry_text_size,'px;">\n');
  for(var i = 0; i < num_categories; ++i){
    var category = categories[i];
    result.push('<g style="fill:',tree_colors[i],'; stroke:',tree_colors[i],';">\n');
    
    var sub_categories = category.children || [];
    var num_sub_categories = sub_categories.length;
    for(var k = 0; k < num_sub_categories; ++k){
      var sub_category = sub_categories[k];
      result.push('<g>\n');
      var is_flipped = (sub_category.angle > (full_angle / 2));
      
      // Draw the entries and the curvy trees
      var entries = sub_category.children || [];
      var num_entries = entries.length;
      for(var m = 0; m < num_entries; ++m){
        var entry = entries[m];
        var angle_in_degrees = entry.angle * 360.0 / full_angle - 90.0;
        if(entry.article){
          result.push('<a xlink:href="',link_prefix,entry.article,'">\n');
        }
        result.push('<g transform="rotate(',angle_in_degrees,') translate(',tree_radii[2],')">\n', // Using a more pleasant coordinate system
          '<circle cx="3" r="',small_dot_radius,'"/>\n', // Draw a small dot
          '<text x="12" y="4" ',(is_flipped? text_flipping_attributes:''),'>',
          entry.name,'</text>\n', // Draw the entry's text
          '</g>\n');
        push_radial_path(result, tree_radii[1], sub_category.angle, tree_radii[2], entry.angle, full_angle);
        if(entry.article){
          result.push('</a>\n');
        }
      }
      push_radial_path(result, tree_radii[0], category.angle, tree_radii[1], sub_category.angle, full_angle);
      
      // Draw the subcategories
      var position = polar_to_cartesian(circumcircle_radius, sub_category.angle, full_angle);
      push_circle(result, position, big_dot_radius);
      
      var text_attributes = ['style="font-size:',subcategory_text_size,'px;" '];
      if(is_flipped){
        text_attributes.push('transform="translate(',position.x-24,',',position.y,')" text-anchor="end"');
      }else{
        text_attributes.push('transform="translate(',position.x+24,',',position.y,')"');
      }
      var alignment = 0.5 * (1.0 + Math.cos(sub_category.angle * 2*Math.PI / full_angle));
      push_text(result, sub_category.name, subcategory_text_size, text_attributes, alignment);
      result.push('</g>\n');
    }
    result.push('</g>\n');
  }
  result.push('</g>\n');
  
  // Truncate all numbers.
  for(var i = 0; i < result.length; ++i){
    if(typeof result[i] !== "number"){ continue; }
    result[i] = result[i].toFixed(1);
  }
  
  var biases = document.getElementById("biases");
  biases.innerHTML = result.join('');

  return document
};

