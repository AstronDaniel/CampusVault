package com.example.campusvault.ui.main.home.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Filter;
import android.widget.Filterable;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.example.campusvault.R;
import com.example.campusvault.data.models.CourseUnit;
import java.util.ArrayList;
import java.util.List;

public class SearchSuggestionAdapter extends ArrayAdapter<CourseUnit> implements Filterable {
    
    private List<CourseUnit> allCourseUnits;
    private List<CourseUnit> suggestions;
    private final LayoutInflater inflater;
    private OnSuggestionClickListener listener;

    public interface OnSuggestionClickListener {
        void onSuggestionClicked(CourseUnit courseUnit);
    }

    public SearchSuggestionAdapter(@NonNull Context context, @NonNull List<CourseUnit> courseUnits) {
        super(context, R.layout.item_search_suggestion, courseUnits);
        this.allCourseUnits = new ArrayList<>(courseUnits);
        this.suggestions = new ArrayList<>();
        this.inflater = LayoutInflater.from(context);
    }

    public void setOnSuggestionClickListener(OnSuggestionClickListener listener) {
        this.listener = listener;
    }

    public void updateCourseUnits(List<CourseUnit> newCourseUnits) {
        this.allCourseUnits = new ArrayList<>(newCourseUnits);
        notifyDataSetChanged();
    }

    @Override
    public int getCount() {
        return suggestions.size();
    }

    @Nullable
    @Override
    public CourseUnit getItem(int position) {
        if (position >= 0 && position < suggestions.size()) {
            return suggestions.get(position);
        }
        return null;
    }

    @Override
    public long getItemId(int position) {
        CourseUnit item = getItem(position);
        return item != null ? item.getId() : position;
    }

    @NonNull
    @Override
    public View getView(int position, @Nullable View convertView, @NonNull ViewGroup parent) {
        View view = convertView;
        ViewHolder holder;

        if (view == null) {
            view = inflater.inflate(R.layout.item_search_suggestion, parent, false);
            holder = new ViewHolder();
            holder.tvCode = view.findViewById(R.id.tvSuggestionCode);
            holder.tvName = view.findViewById(R.id.tvSuggestionName);
            view.setTag(holder);
        } else {
            holder = (ViewHolder) view.getTag();
        }

        CourseUnit courseUnit = getItem(position);
        if (courseUnit != null) {
            holder.tvCode.setText(courseUnit.getCode());
            holder.tvName.setText(courseUnit.getName());
        }

        return view;
    }

    @NonNull
    @Override
    public Filter getFilter() {
        return new Filter() {
            @Override
            protected FilterResults performFiltering(CharSequence constraint) {
                FilterResults results = new FilterResults();
                
                if (constraint == null || constraint.length() == 0) {
                    // Show first 5 items as default suggestions
                    List<CourseUnit> defaultSuggestions = new ArrayList<>();
                    for (int i = 0; i < Math.min(5, allCourseUnits.size()); i++) {
                        defaultSuggestions.add(allCourseUnits.get(i));
                    }
                    results.values = defaultSuggestions;
                    results.count = defaultSuggestions.size();
                } else {
                    String query = constraint.toString().toLowerCase().trim();
                    List<CourseUnit> filtered = new ArrayList<>();
                    
                    for (CourseUnit courseUnit : allCourseUnits) {
                        // Match by code or name
                        boolean matchesCode = courseUnit.getCode() != null && 
                            courseUnit.getCode().toLowerCase().contains(query);
                        boolean matchesName = courseUnit.getName() != null && 
                            courseUnit.getName().toLowerCase().contains(query);
                        
                        if (matchesCode || matchesName) {
                            filtered.add(courseUnit);
                        }
                        
                        // Limit suggestions to 8
                        if (filtered.size() >= 8) break;
                    }
                    
                    results.values = filtered;
                    results.count = filtered.size();
                }
                
                return results;
            }

            @SuppressWarnings("unchecked")
            @Override
            protected void publishResults(CharSequence constraint, FilterResults results) {
                suggestions.clear();
                if (results.values != null) {
                    suggestions.addAll((List<CourseUnit>) results.values);
                }
                notifyDataSetChanged();
            }

            @Override
            public CharSequence convertResultToString(Object resultValue) {
                if (resultValue instanceof CourseUnit) {
                    return ((CourseUnit) resultValue).getName();
                }
                return super.convertResultToString(resultValue);
            }
        };
    }

    private static class ViewHolder {
        TextView tvCode;
        TextView tvName;
    }
}
