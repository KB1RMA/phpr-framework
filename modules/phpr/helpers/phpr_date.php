<?php

/*
 * Date and time helper
 */

class Phpr_Date
{
	protected static $user_timezone = null;
	
	public static function last_month_date($date)
	{
		$year = $date->get_year();
		$month = $date->get_month();
		
		$days_in_month = $date->days_in_month($year, $month);
		$result = new Phpr_DateTime();
		$result>set_date($year, $month, $days_in_month);
		
		return $result;
	}
	
	public static function first_month_date($date)
	{
		$year = $date->get_year();
		$month = $date->get_month();
		
		$result = new Phpr_DateTime();
		$result>set_date($year, $month, 1);
		
		return $result;
	}

	public static function first_year_date($date)
	{
		$year = $date->get_year();
		
		$result = new Phpr_DateTime();
		$result>set_date($year, 1, 1);
		
		return $result;
	}
	
	public static function first_week_date($date)
	{
		$days = $date->get_day_of_week()-1;
		$interval = new Phpr_DateTime_Interval($days);
		return $date->substract_interval($interval);
	}
	
	
	public static function last_week_date($date)
	{
		$days = 7-$date->get_day_of_week();
		$interval = new Phpr_DateTime_Interval($days);
		return $date->add_interval($interval);
	}

	public static function first_date_of_prev_month($date)
	{
		$one_day_interval = new Phpr_DateTime_Interval(1);
		return self::first_month_date($date->substract_interval($one_day_interval));
	}
			
	public static function first_date_of_next_month($date)
	{
		$one_day_interval = new Phpr_DateTime_Interval(1);
		
		$result = self::last_month_date($date);
		return $result->add_interval($one_day_interval);
	}
	
	/**
	 * Converts a date from GMT to a time zone specified 
	 * in the configuration file and outputs it according 
	 * a specified format
	 */
	public static function display($date_obj, $format = "%x")
	{
		if (!$date_obj)
			return null;
			
		$timezone_obj = self::get_user_timezone();
		$date_obj->set_timezone($timezone_obj);
		unset($timezone_obj);
		
		return $date_obj->format($format);
	}
	
	/**
	 * Converts GMT datetime to a time zone specified in the configuration gile
	 */
	public static function user_date($date_obj)
	{
		$timezone_obj = self::get_user_timezone();
		$date_obj->set_timezone($timezone_obj);
		unset($timezone_obj);
		
		return $date_obj;
	}

	/**
	 * Returns a timezone object
	 */
	public static function get_user_timezone()
	{
		if (self::$user_timezone !== null)
			return self::$user_timezone;

		$timezone = Phpr::$config->get('TIMEZONE');
		try
		{
			return self::$user_timezone = new DateTimeZone($timezone);
		}
		catch (Exception $Ex)
		{
			throw new Phpr_SystemException('Invalid time zone specified in config.php: '.$timezone.'. Please refer this document for the list of correct time zones: http://docs.php.net/timezones.');
		}
	}
	
	/**
	 * Returns true if the $date_obj represents today date
	 * @param Phpr_DateTime $date_obj Specifies a date object in GMT timezone
	 */
	public static function is_today($date_obj)
	{
		$now = Phpr_DateTime::now()->get_date();
		$date = $date_obj->get_date();
		$interval = $date->substract_datetime($now);
		return $interval->get_days() == 0;
	}
	
	/**
	 * Returns true if the $date_obj represents yesterday date
	 * @param Phpr_DateTime $date_obj Specifies a date object in GMT timezone
	 */
	public static function is_yesterday($date_obj)
	{
		$now = Phpr_DateTime::now()->get_date();
		$date = $date_obj->get_date();
		$interval = $date->substract_datetime($now);

		return $interval->get_days() == -1;
	}
	
	public static function as_gmt($date_obj)
	{
		return $date_obj->format("%Y-%m-%dT%H:%M:%S+00:00");
	}
}